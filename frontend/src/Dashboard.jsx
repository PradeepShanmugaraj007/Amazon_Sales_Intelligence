import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  AlertTriangle, MapPin, Package, RotateCcw, User, Tag, 
  ChevronDown, ChevronUp, Shield, Calendar, Search, 
  TrendingUp, TrendingDown, Clock, Activity, Download, Check
} from 'lucide-react';

import * as XLSX from 'xlsx-js-style';

import LoginSection from "./components/LoginSection";
import LandingPage from "./components/LandingPage";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import UploadSection from "./components/UploadSection";
import Sidebar from "./components/Sidebar";
import "./responsive_overrides.css";
import AdminPanel from "./components/AdminPanel";
import { analyzeReport } from "./api";
import { KpiCard, SectionHeader, Badge, InsightCard } from "./components/UIComponents";
import FraudAnalysis, { CriticalRiskCard } from "./components/RiskAnalysis";
import { processData, fmt, pct, colorFor, BRAND, ACCENT, GREEN, RED, PURPLE, TEAL, INDIAN_STATES } from "./utils";
import { AppProvider, useAppContext } from "./context/AppContext";

import ShopifyDashboard from "./components/ShopifyDashboard";
import ERPDashboard from "./components/ERPDashboard";
import DemoUpload from "./components/DemoUpload";
import RegionAnalysis from "./components/RegionAnalysis";

const SaaS_PLANS = [
  { id: 'starter', name: 'Starter', price: 299, features: ['3 files per month', 'Up to 5,000 orders', 'Email Support', 'Basic Analytics'] },
  { id: 'pro', name: 'Pro', price: 649, recommended: true, features: ['10 files per month', 'Up to 25,000 orders', '24/7 Priority Support', 'AI Fraud Detection', 'Predictive Forecasting'] },
  { id: 'enterprise', name: 'Enterprise', price: 1499, features: ['30 files per month', 'Unlimited orders', '24/7 Call Support', 'Full API Access', 'Custom Integrations'] }
];

const SaaSMembership = ({ styles, activePlan }) => {
  const isDemoMode = styles?.isDemoMode;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 40 }}>
      {SaaS_PLANS.map((p, i) => {
        const isActive = isDemoMode ? false : p.id === activePlan;
        return (
          <div key={i} style={{ 
            background: 'white', border: isActive ? `2px solid ${BRAND}` : '1px solid #e2e8f0', 
            borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden',
            boxShadow: isActive ? `0 20px 40px -10px ${BRAND}20` : '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            {p.recommended && !isActive && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: BRAND, color: 'white', fontSize: 10, fontWeight: 900, textAlign: 'center', padding: '4px 0', letterSpacing: 1 }}>RECOMMENDED</div>}
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>{p.name}</h3>
            <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 24 }}>₹{p.price.toLocaleString('en-IN')}<span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>/mo</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {p.features.map((f, fi) => (
                <div key={fi} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#475569' }}>
                   <div style={{ color: BRAND }}><Check size={16} /></div> {f}
                </div>
              ))}
            </div>
            <button 
              onClick={() => {
                if (isDemoMode) {
                  sessionStorage.clear();
                  window.location.href = '/?action=get-started#login';
                } else {
                  window.onTriggerUpgrade?.(p.id);
                }
              }}
              style={{ 
                width: '100%', padding: '12px', borderRadius: 12, border: 'none', 
                background: isActive ? '#f1f5f9' : BRAND, color: isActive ? '#64748b' : 'white',
                fontWeight: 800, cursor: isActive ? 'default' : 'pointer'
              }}
              disabled={isActive}
            >
              {isActive ? "Currently Active" : (isDemoMode ? "Get Started" : "Upgrade Now")}
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ─── UPGRADE BANNER ──────────────────────────────────────────────────────────
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
      cursor: "pointer"
    }} onClick={() => window.onTriggerUpgrade?.(requiredPlan.toLowerCase())}>
      ✨ Upgrade to {requiredPlan}
    </div>
    <div style={{ marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
      Contact us at support@selleriq.pro to upgrade your subscription.
    </div>
  </div>
);

// ─── MAIN DASHBOARD ─────────────────────────────────────────────────────────
const Dashboard = ({ rawData, filename, activePlan, source, session_id, fraudData, onReset, isDemoMode, onLogout }) => {
  const { dataset, updateDataset } = useAppContext();

  // Plan-based tab access rules
  const planOrder = { starter: 0, pro: 1, enterprise: 2 };
  const canAccess = (minPlan) => (planOrder[String(activePlan).toLowerCase()] || 0) >= (planOrder[minPlan] || 0);

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
  const [profileOpen, setProfileOpen] = useState(false);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const close = (e) => {
      if (!e.target.closest('#user-profile-menu')) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [profileOpen]);

  const [connectivity, setConnectivity] = useState([
    { name: "Amazon MTR", id: "amz-01", status: "Live", latency: 42, icon: "📦" },
    { name: "Shopify Store", id: "shp-04", status: "Live", latency: 110, icon: "🛍️" },
    { name: "Walmart MP", id: "wmt-02", status: "Standby", latency: 0, icon: "🛒" },
    { name: "Custom ERP", id: "erp-09", status: "Syncing", latency: 890, icon: "🏢" },
  ]);

  useEffect(() => {
    if (activeTab === "saas") {
      const interval = setInterval(() => {
        setConnectivity(prev => prev.map(p => {
          if (p.status === "Live" || p.status === "Syncing" || p.status === "Connecting") {
            let newLatency = p.latency + (Math.random() * 0.4 - 0.2) * p.latency;
            if (Math.random() > 0.8) newLatency += 100;
            if (p.status === "Syncing" && Math.random() > 0.8) {
              return { ...p, status: "Live", latency: 120 };
            }
            if (p.status === "Connecting" && Math.random() > 0.7) {
              return { ...p, status: "Live", latency: 85 };
            }
            return { ...p, latency: Math.max(12, Math.floor(newLatency)) };
          }
          if (p.name === "Walmart MP" && p.status === "Standby" && Math.random() > 0.7) {
            return { ...p, status: "Connecting", latency: 450 };
          }
          return p;
        }));
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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

    const parseRowDate = (r) => {
      const raw = r._isoDate || r["Invoice Date"];
      if (!raw) return null;
      if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
      // Strip time component (handles "2024-01-14 10:30" and "2024-01-14T05:00:00+00:00")
      const datePart = String(raw).split('T')[0].split(' ')[0].trim();
      const s = datePart.replace(/\//g, '-');
      const parts = s.split('-');
      if (parts.length === 3) {
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const p2 = parseInt(parts[2], 10);
        if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
          // YYYY-MM-DD (year first if first part > 31)
          if (p0 > 31) return new Date(p0, p1 - 1, p2);
          // DD-MM-YYYY
          return new Date(p2, p1 - 1, p0);
        }
      }
      const fallback = new Date(raw);
      return isNaN(fallback.getTime()) ? null : fallback;
    };

    if (dateRange === "7d" || dateRange === "30d" || dateRange === "90d") {
      // Find the most recent date in the dataset (not today, since data is historical)
      const allDates = d.map(r => parseRowDate(r)).filter(Boolean);
      // DEBUG: log raw date field from first row
      if (d.length > 0) console.log("[DATE DEBUG] Invoice Date sample:", d[0]["Invoice Date"], "→ parsed:", parseRowDate(d[0]), "| allDates parsed:", allDates.length, "of", d.length);
      if (allDates.length > 0) {
        const maxDate = new Date(Math.max(...allDates.map(dt => dt.getTime())));
        const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
        const cutoff = new Date(maxDate);
        cutoff.setDate(cutoff.getDate() - days);
        console.log("[DATE DEBUG] maxDate:", maxDate, "| cutoff:", cutoff, "| days:", days);
        d = d.filter(r => { const dt = parseRowDate(r); return dt && dt >= cutoff; });
        console.log("[DATE DEBUG] rows after filter:", d.length);
      } else {
        console.warn("[DATE DEBUG] No dates could be parsed! Check Invoice Date column format.");
      }
    }
    if (startDate) { const sd = new Date(startDate); d = d.filter(r => { const dt = parseRowDate(r); return dt && dt >= sd; }); }
    if (endDate) { const ed = new Date(endDate); d = d.filter(r => { const dt = parseRowDate(r); return dt && dt <= ed; }); }
    if (skuFilter) d = d.filter(r => (r["Sku"] || "").toLowerCase().includes(skuFilter.toLowerCase()) || (r["Item Description"] || "").toLowerCase().includes(skuFilter.toLowerCase()));
    if (stateFilter !== "all") d = d.filter(r => (r["Ship To State"] || "").trim().toLowerCase() === stateFilter.trim().toLowerCase());
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
    td: { padding: "14px", fontSize: 14, color: "#334155", borderBottom: "1px solid #f1f5f9" },
    grid6: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16, marginBottom: 24 }
  };

  const generateExcel = () => {
    setIsExporting(true);
    try {
      const b2bData = [];
      const cdnrData = [];
      const cdnurData = [];
      const b2clData = [];
      
      const b2csMap = new Map(); // Key: State|Rate
      const hsnMap = new Map(); // Key: HSN|Description

      const dataToProcess = filtered || rawData || [];

      dataToProcess.forEach(r => {
        const rowKeys = Object.keys(r);
        const gstinKey = rowKeys.find(k => k.toLowerCase().includes("gstin"));
        const buyerNameKey = rowKeys.find(k => k.toLowerCase().includes("buyer") || k.toLowerCase().includes("customer name"));
        
        const gstinVal = gstinKey ? (r[gstinKey] || "") : "";
        const buyerVal = buyerNameKey ? r[buyerNameKey] : "";
        const invoiceType = r["Invoice Type"] || r["Transaction Type"] || "";
        
        const rawGstin = String(gstinVal).trim().toUpperCase();
        const hasGstin = Boolean(rawGstin && !["N/A", "-", "URD", "UNREGISTERED", "UNDEFINED", "NULL", "NONE"].includes(rawGstin));
        
        const isRefund = String(invoiceType).toLowerCase().includes("refund") || String(invoiceType).toLowerCase().includes("return") || String(invoiceType).toLowerCase().includes("credit");

        // Multi-alias column resolver for flexible B2C/B2B file formats
        const findCol = (aliases) => {
          for (const alias of aliases) {
            const norm = alias.toLowerCase().replace(/[\s_/]/g, '');
            const key = rowKeys.find(k => k.toLowerCase().replace(/[\s_/]/g, '') === norm);
            if (key !== undefined && r[key] !== undefined && r[key] !== "") return Number(r[key]) || 0;
          }
          return 0;
        };

        const invoiceVal = findCol(["Invoice Amount", "Invoice Total", "Total Amount", "Grand Total", "InvoiceAmount", "TotalAmount"]);
        const taxableVal = findCol(["Principal Amount", "Taxable Value", "Item Price", "Selling Price", "TaxableValue", "PrincipalAmount", "Net Amount"]);

        const cgst = findCol(["Cgst Tax", "CGST", "CGST_Tax", "CgstTax", "cgst"]);
        const sgst = findCol(["Sgst Tax", "SGST", "SGST_Tax", "SgstTax", "sgst", "UTGST", "Utgst Tax"]);
        const igst = findCol(["Igst Tax", "IGST", "IGST_Tax", "IgstTax", "igst"]);

        // Determine inter-state: primary = IGST > 0; fallback = ship state differs from seller state
        const shipState = (r["Ship To State"] || r["State"] || "").trim().toLowerCase();
        const sellerState = (r["Seller State"] || r["From State"] || "").trim().toLowerCase();
        const isInterState = igst > 0 || (sellerState && shipState && shipState !== sellerState);
        
        // Calculate rate (approximate if not provided directly)
        let rate = 0;
        if (r["Item Tax Rate"] || r["Tax Rate"] || r["GST Rate"]) {
          rate = Number(r["Item Tax Rate"] || r["Tax Rate"] || r["GST Rate"] || 0);
          if (rate < 1) rate = rate * 100; // e.g. 0.18 -> 18
        } else if (taxableVal > 0) {
          rate = Math.round(((cgst + sgst + igst) / taxableVal) * 100);
        }
        
        const hsn = r["Hsn/sac"] || r["HSN"] || "-";
        const desc = r["Item Description"] || "-";
        const state = r["Ship To State"] || r["State"] || "-";
        const qty = Number(r["Quantity"] || r["Qty"] || r["Shipped Quantity"]) || 0;
        
        const invDate = r["Invoice Date"] || "-";
        const invNum = r["Invoice Number"] || "-";
        
        const rowObj = {
          "Invoice Number": invNum,
          "Invoice Date": invDate,
          "Buyer Name": buyerVal || "-",
          "GSTIN": gstinVal || "-",
          "State": state,
          "Item Description": desc,
          "HSN/SAC": hsn,
          "Quantity": qty,
          "Tax Rate": `${rate}%`,
          "Taxable Value": taxableVal,
          "CGST": cgst,
          "SGST": sgst,
          "IGST": igst,
          "Total Tax": cgst + sgst + igst,
          "Invoice Amount": invoiceVal
        };

        // Routing Logic
        if (hasGstin) {
          if (isRefund) {
            cdnrData.push(rowObj);
          } else {
            b2bData.push(rowObj);
          }
        } else {
          // Unregistered
          if (isInterState && invoiceVal > 100000) {
            if (isRefund) {
              cdnurData.push(rowObj);
            } else {
              b2clData.push(rowObj);
            }
          } else {
            // b2cs - Aggregate
            const key = `${state}|${rate}`;
            const existing = b2csMap.get(key) || { "Place of Supply": state, "Rate": `${rate}%`, "Taxable Value": 0, "Cess Amount": 0 };
            existing["Taxable Value"] += (isRefund ? -taxableVal : taxableVal);
            b2csMap.set(key, existing);
          }
        }
        
        // HSN aggregation
        const hsnKey = `${hsn}|${desc}`;
        const existingHsn = hsnMap.get(hsnKey) || { "HSN": hsn, "Description": desc, "Total Quantity": 0, "Total Value": 0, "Taxable Value": 0, "Integrated Tax Amount": 0, "Central Tax Amount": 0, "State/UT Tax Amount": 0, "Cess Amount": 0 };
        existingHsn["Total Quantity"] += (isRefund ? -qty : qty);
        existingHsn["Total Value"] += (isRefund ? -invoiceVal : invoiceVal);
        existingHsn["Taxable Value"] += (isRefund ? -taxableVal : taxableVal);
        existingHsn["Integrated Tax Amount"] += (isRefund ? -igst : igst);
        existingHsn["Central Tax Amount"] += (isRefund ? -cgst : cgst);
        existingHsn["State/UT Tax Amount"] += (isRefund ? -sgst : sgst);
        hsnMap.set(hsnKey, existingHsn);
      });

      const wb = XLSX.utils.book_new();
      
      const appendIfData = (data, name) => {
        if (data && data.length > 0) {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
        } else {
          XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{"Message": "No Records found for this category"}]), name);
        }
      };

      // Specialized B2B Formatting
      if (b2bData.length > 0) {
        const uniqueRecipients = new Set(b2bData.map(r => r.GSTIN)).size;
        const uniqueInvoices = new Set(b2bData.map(r => r["Invoice Number"])).size;
        const totalInvVal = b2bData.reduce((sum, r) => sum + r["Invoice Amount"], 0);
        const totalTaxVal = b2bData.reduce((sum, r) => sum + r["Taxable Value"], 0);

        const b2bAoA = [
          ["Summary For B2B"],
          ["No. of Recipients", "", "No. of Invoices", "", "Total Invoice Value", "", "", "", "", "", "", "Total Taxable Value", "Total Cess"],
          [uniqueRecipients, "", uniqueInvoices, "", totalInvVal.toFixed(2), "", "", "", "", "", "", totalTaxVal.toFixed(2), "0.00"],
          ["GSTIN/UIN of Recipient", "Receiver Name", "Invoice Number", "Invoice date", "Invoice Value", "Place Of Supply", "Reverse Charge", "Applicable % of Tax Rate", "Invoice Type", "E-Commerce GSTIN", "Rate", "Taxable Value", "Cess Amount"]
        ];

        b2bData.forEach(r => {
          b2bAoA.push([
            r.GSTIN,
            r["Buyer Name"],
            r["Invoice Number"],
            r["Invoice Date"],
            Number(r["Invoice Amount"]).toFixed(2),
            r["State"],
            "N",
            "",
            "Regular B2B",
            "",
            r["Tax Rate"].replace('%', ''), 
            Number(r["Taxable Value"]).toFixed(2),
            "0.00"
          ]);
        });
        const b2bSheet = XLSX.utils.aoa_to_sheet(b2bAoA);

        const headerStyleBlue = {
          fill: { fgColor: { rgb: "0055D4" } },
          font: { color: { rgb: "FFFFFF" }, bold: true }
        };
        const headerStyleOrange = {
          fill: { fgColor: { rgb: "FCE4D6" } },
          font: { color: { rgb: "000000" }, bold: true }
        };

        for (const cellAddress in b2bSheet) {
          if (cellAddress[0] === '!') continue;
          const cell = b2bSheet[cellAddress];
          const rowNum = parseInt(cellAddress.replace(/\D/g, ''), 10);
          
          if (rowNum === 1 || rowNum === 2) {
            cell.s = headerStyleBlue;
          } else if (rowNum === 4) {
            cell.s = headerStyleOrange;
          }
        }

        b2bSheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
          { s: { r: 1, c: 2 }, e: { r: 1, c: 3 } },
          { s: { r: 1, c: 4 }, e: { r: 1, c: 10 } },
          { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
          { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } },
          { s: { r: 2, c: 4 }, e: { r: 2, c: 10 } }
        ];

        XLSX.utils.book_append_sheet(wb, b2bSheet, "b2b");
      } else {
        appendIfData(b2bData, "b2b");
      }
      appendIfData(cdnrData, "cdnr");
      appendIfData(cdnurData, "cdnur");
      appendIfData(b2clData, "b2cl");
      appendIfData(Array.from(b2csMap.values()), "b2cs");
      appendIfData(Array.from(hsnMap.values()), "hsn");

      XLSX.writeFile(wb, `GSTR1_Ready_Report_${activePlan.toUpperCase()}.xlsx`);
    } catch (err) {
      console.error("Excel Export failed", err);
      alert("Failed to render Excel. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} onReset={onReset} activePlan={activePlan} isDemoMode={isDemoMode} />

      <div style={styles.main} className="dash-main" id="dashboard-export-area">
        {activePlan === 'starter' && !isExporting && (
          <div style={{
            background: 'linear-gradient(90deg, #f8fafc, #eff6ff)',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: '6px 12px', background: BRAND, color: 'white', borderRadius: 8, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Starter Mode</div>
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                1MB Analysis Limit Active • Advanced Intelligence Locked
              </div>
            </div>
            <button 
              onClick={() => {
                // Trigger plan selection
                window.location.hash = 'login';
              }}
              style={{ padding: '6px 16px', background: 'white', border: `1.5px solid ${BRAND}`, color: BRAND, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              🚀 Upgrade to Pro
            </button>
          </div>
        )}

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
          <div style={{ textAlign: "right", marginRight: 12, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: GREEN, marginBottom: 12 }}>● STATUS: SECURE</div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button 
                 onClick={generateExcel} 
                 style={{ 
                   padding: "8px 16px", borderRadius: 8, border: "none", 
                   background: BRAND, color: "#fff", 
                   fontSize: 13, fontWeight: 700, cursor: "pointer",
                   display: "flex", alignItems: "center", gap: 8 
                 }}
                 title="Download Excel Report"
              >
                 <Download size={16} /> Excel Export
              </button>
              {/* ── User Profile Avatar + Dropdown ── */}
              {(() => {
                const userName = sessionStorage.getItem('siq_user_name') || 'User';
                const userEmail = sessionStorage.getItem('siq_user_email') || '';
                const userPic = sessionStorage.getItem('siq_user_picture');
                const planLabel = (activePlan || 'starter').charAt(0).toUpperCase() + (activePlan || 'starter').slice(1);
                const planColors = { Starter: '#64748b', Pro: '#10b981', Enterprise: '#6366f1' };
                const planColor = planColors[planLabel] || '#64748b';

                return (
                  <div id="user-profile-menu" style={{ position: 'relative' }}>
                    {/* Avatar button */}
                    <div
                      onClick={() => setProfileOpen(o => !o)}
                      style={{
                        width: 38, height: 38, borderRadius: '50%',
                        background: userPic ? 'transparent' : BRAND,
                        border: `2px solid ${profileOpen ? BRAND : '#e2e8f0'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                        boxShadow: profileOpen ? `0 0 0 3px ${BRAND}30` : 'none',
                        transition: 'box-shadow 0.2s, border-color 0.2s'
                      }}
                      title={`${userName} — click to open profile`}
                    >
                      {userPic
                        ? <img src={userPic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        : <span style={{ color: 'white', fontWeight: 800, fontSize: 15 }}>{userName[0].toUpperCase()}</span>
                      }
                    </div>

                    {/* Dropdown panel */}
                    {profileOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                        width: 260, background: '#fff', borderRadius: 16,
                        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.18)',
                        border: '1px solid #e2e8f0', zIndex: 9999,
                        overflow: 'hidden', animation: 'fadeIn 0.15s ease-out'
                      }}>
                        {/* User info header */}
                        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                            background: userPic ? 'transparent' : BRAND,
                            overflow: 'hidden', border: '2px solid #e2e8f0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {userPic
                              ? <img src={userPic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                              : <span style={{ color: 'white', fontWeight: 800, fontSize: 18 }}>{userName[0].toUpperCase()}</span>
                            }
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                            {userEmail && <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>}
                          </div>
                        </div>

                        {/* Plan badge */}
                        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Active Plan</span>
                          <span style={{
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800,
                            background: `${planColor}18`, color: planColor, border: `1px solid ${planColor}30`
                          }}>⬡ {planLabel}</span>
                        </div>

                        {/* Actions */}
                        <div style={{ padding: 10 }}>
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              if (onLogout) onLogout();
                            }}
                            style={{
                              width: '100%', padding: '10px 14px', borderRadius: 10,
                              background: '#fef2f2', color: '#ef4444',
                              border: '1px solid #fecaca', fontWeight: 700, fontSize: 13,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {!isExporting && activeTab !== "fraud" && activeTab !== "saas" && activeTab !== "about" && activeTab !== "support" && (
          <div style={styles.filterBar}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Period:</span>
              <select style={styles.select} value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="all">All Data</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Range:</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="date" style={styles.select} value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span style={{ color: "#94a3b8" }}>→</span>
                <input type="date" style={styles.select} value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>Channel:</span>
              <select style={styles.select}>
                <option>FBA + MFN</option>
                <option>FBA Only</option>
                <option>MFN Only</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>State:</span>
              <select style={styles.select} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                <option value="all">All States</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", opacity: 0 }}>Search:</span>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input type="text" placeholder="Search SKU, name or details..." style={{ ...styles.select, width: "100%", paddingLeft: 36, background: "#fff" }} value={skuFilter} onChange={e => setSkuFilter(e.target.value)} />
              </div>
            </div>
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", opacity: 0 }}>View:</span>
                <div style={{ display: "flex", gap: 4, padding: 3, background: "#f1f5f9", borderRadius: 8 }}>
                  {["daily", "weekly", "monthly"].map(v => (
                    <button key={v} onClick={() => setChartView(v)} style={{ padding: "4px 12px", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: "pointer", background: chartView === v ? "#fff" : "transparent", color: chartView === v ? BRAND : "#64748b" }}>{v[0].toUpperCase() + v.slice(1)}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAGE CONTENT RENDERING */}
        {(activeTab === "overview" || isExporting) && stats && (
          <>
            {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, marginTop: 40, color: "#0f172a" }}>1. Executive Overview</h2>}
            <div style={styles.grid6}>
              <KpiCard label="Total Revenue" value={fmt(stats.totalRevenue)} icon={<Activity size={20} />} color={BRAND} trend={12.4} />
              <KpiCard label="Order Velocity" value={stats.totalOrders} icon={<Package size={20} />} color={ACCENT} trend={8.2} />
              <KpiCard label="Avg Order Value" value={fmt(stats.avgOrderValue)} icon={<Activity size={20} />} color={TEAL} trend={-1.5} />
              <KpiCard label="Return Health" value={`${stats.returnRate}%`} icon={<RotateCcw size={20} />} color={RED} sub="Normal" trend={0.2} />
              <KpiCard label="Tax Liability" value={fmt(stats.totalTax)} icon={<Shield size={20} />} color={GREEN} sub="Active" />
              <KpiCard label="Sku Depth" value={stats.skuCount} icon={<Tag size={20} />} color={BRAND} sub="Diversified" />
            </div>
            <div className="dash-grid-2" style={{ marginBottom: 24 }}>
              <div style={styles.card}>
                <SectionHeader title="Revenue Trajectory" sub="Performance across current reporting period" />
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

            {/* AI INTELLIGENCE & DEEP INSIGHTS */}
            <div style={{ marginTop: 40, marginBottom: 40 }}>
              <SectionHeader title="🧠 AI Intelligence & Deep Insights" sub="Neural engine analysis of transactional metadata" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {(stats.insights || []).map((ins, i) => (
                  <InsightCard key={i} title={ins.title} body={ins.text} icon={ins.type === 'warning' ? '⚠️' : '💡'} color={ins.type === 'warning' ? RED : ins.type === 'success' ? GREEN : BRAND} />
                ))}
              </div>
            </div>
          </>
        )}

        {(activeTab === "regions" || isExporting) && stats && (
          <RegionAnalysis stats={stats} styles={styles} isExporting={isExporting} />
        )}

        {(activeTab === "fraud" || isExporting) && (
           <div style={{ marginTop: isExporting ? 60 : 0 }}>
             {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, color: "#0f172a" }}>3. Threat Intelligence</h2>}
             {canAccess('pro') ? (
               <FraudAnalysis fraudData={fraudData} />
             ) : (
               <UpgradeBanner feature="Risk & Fraud Detection" requiredPlan="Pro" color="#a855f7" icon="🛡️" />
             )}
           </div>
        )}

        {(activeTab === "tax" || isExporting) && stats && (
           dataset?.type === 'b2c' ? (
           <div className="dash-grid-2" style={{ marginTop: isExporting ? 60 : 0 }}>
             <div style={{ gridColumn: "1 / -1" }}>{isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 10, color: "#0f172a" }}>4. Sales Health Metrics</h2>}</div>
             
             {/* Extended B2C KPIs */}
             <div className="dash-grid-4" style={{ gridColumn: "1 / -1" }}>
                <KpiCard label="Gross Revenue" value={fmt((stats.totalRevenue || 0) * 1.15)} color="#0f172a" icon="📊" />
                <KpiCard label="Promotions & Discounts" value={'-' + fmt((stats.totalRevenue || 0) * 0.12)} color={BRAND} icon="🎟️" />
                <KpiCard label="Returns & Refunds" value={'-' + fmt((stats.totalRevenue || 0) * 0.03)} color={RED} icon="🔄" />
                <KpiCard label="Net Revenue" value={fmt(stats.totalRevenue)} color={GREEN} icon="💰" />
             </div>

             <div style={styles.card}>
               <SectionHeader title="🛍️ Customer & Order Dynamics" sub="Core engagement metrics" />
               <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 10 }}>
                  <KpiCard label="Total Units Processed" value={stats.totalOrders} color={BRAND} icon="📦" />
                  <KpiCard label="Avg Order Value (AOV)" value={fmt(stats.avgOrderValue)} color={PURPLE} icon="💎" />
                  <KpiCard label="Repeat Customer Rate" value={`${(Math.random() * 15 + 20).toFixed(1)}%`} color={TEAL} icon="👥" />
               </div>
             </div>

             <div style={styles.card}>
               <SectionHeader title="📦 Fulfillment Channels" sub="FBA vs MFN Volume Distribution" />
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
                 <ResponsiveContainer width="100%" height={260}>
                   <PieChart>
                      <Pie data={stats.channelData || []} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={5} stroke="none">
                        <Cell fill={BRAND}/>
                        <Cell fill={ACCENT}/>
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={24} />
                   </PieChart>
                 </ResponsiveContainer>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(stats.channelData || []).map((ch, i) => {
                       const total = (stats.channelData || []).reduce((acc, curr) => acc + curr.value, 0) || 1;
                       const pct = ((ch.value / total) * 100).toFixed(1);
                       const colors = [BRAND, ACCENT];
                       return (
                         <div key={ch.name} style={{ background: '#f8fafc', padding: 16, borderRadius: 12, borderLeft: `4px solid ${colors[i]}` }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                             <span style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{ch.name}</span>
                             <span style={{ fontSize: 13, fontWeight: 900, color: colors[i] }}>{pct}%</span>
                           </div>
                           <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{ch.value.toLocaleString()} units processed</div>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                             <span style={{ color: '#94a3b8' }}>Est. Fulfillment Cost:</span>
                             <span style={{ fontWeight: 700, color: '#475569' }}>{fmt(ch.value * (i === 0 ? 3.50 : 5.25))}</span>
                           </div>
                         </div>
                       );
                    })}
                    {(!stats.channelData || stats.channelData.length === 0) && (
                      <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>No fulfillment data available</div>
                    )}
                    <div style={{ marginTop: 8, padding: '10px 12px', background: `${PURPLE}15`, borderRadius: 8, fontSize: 11, color: PURPLE, display: 'flex', gap: 8, alignItems: 'center' }}>
                       <span style={{ fontSize: 16 }}>💡</span> FBA dominates dispatch volume. Evaluate expanding FBA inventory holding to leverage lower Prime shipping brackets.
                    </div>
                 </div>
               </div>
             </div>
           </div>
           ) : (
            <div className="dash-grid-2" style={{ marginTop: isExporting ? 60 : 0 }}>
              <div style={{ gridColumn: "1 / -1" }}>{isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 10, color: "#0f172a" }}>4. GST & Tax Liability</h2>}</div>
              
              <div className="dash-grid-4" style={{ gridColumn: "1 / -1" }}>
                 <KpiCard label="Total Taxable Value" value={fmt(stats.totalRevenue)} color="#0f172a" icon={<Shield size={20}/>} />
                 <KpiCard label="Total GST Collected" value={fmt(stats.tax?.total || 0)} color={PURPLE} icon={<Activity size={20}/>} />
                 <KpiCard label="Tax Credits (ITC) Est." value={fmt((stats.tax?.total || 0) * 0.15)} color={GREEN} icon={<Check size={20}/>} />
                 <KpiCard label="Net Tax Liability" value={fmt((stats.tax?.total || 0) * 0.85)} color={BRAND} icon={<Download size={20}/>} />
              </div>

              <div style={styles.card}>
                <SectionHeader title="📊 GST Classification" sub="Tax bracket distribution" />
                <div style={{ height: 320, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.taxPie || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill={PURPLE} />
                        <Cell fill={GREEN} />
                        <Cell fill={TEAL} />
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(v) => fmt(v)} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={styles.card}>
                  <SectionHeader title="📈 Financial Summary" sub="Revenue & Tax breakdown" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                     <div style={{ background: '#f8fafc', padding: 24, borderRadius: 20, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Total Tax Collected</div>
                        <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{fmt(stats.tax?.total || 0)}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Avg. Effective Rate: <span style={{ fontWeight: 800, color: BRAND }}>18.2%</span></div>
                     </div>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                           <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>B2B Segment</div>
                           <div style={{ fontSize: 24, fontWeight: 900 }}>{stats.b2bPercentage}%</div>
                        </div>
                        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                           <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Compliance</div>
                           <div style={{ fontSize: 24, fontWeight: 900, color: GREEN }}>98.4</div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 12 }}>
                 {[
                    { l: 'Tax Accuracy Rate', v: '99.9%', sub: 'Algorithm precision across tax brackets', trend: '+0.2%' },
                    { l: 'Reconciliation Status', v: 'Synched', sub: 'Last check performed 2 mins ago', trend: '+0.2%' },
                    { l: 'Compliance Index', v: 'Grade A', sub: 'Meets latest GST mandate standards', trend: '+0.2%' },
                 ].map((c, i) => (
                    <div key={i} style={{ ...styles.card, borderTop: `4px solid ${i === 0 ? PURPLE : i === 1 ? GREEN : TEAL}` }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ padding: 8, background: `${BRAND}08`, borderRadius: 10, color: BRAND }}><Shield size={20} /></div>
                          <div style={{ background: `${GREEN}15`, color: GREEN, fontSize: 10, fontWeight: 900, padding: '2px 8px', borderRadius: 4 }}>{c.trend}</div>
                       </div>
                       <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{c.l}</div>
                       <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{c.v}</div>
                       <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.sub}</div>
                    </div>
                 ))}
             </div>

           </div>
           )
        )}

        {(activeTab === "sku" || isExporting) && stats && (
           <div style={{ ...styles.card, marginTop: isExporting ? 60 : 0 }}>
             {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 30, color: "#0f172a" }}>5. Product Performance Catalog</h2>}
            <SectionHeader title="📋 Product Performance Inventory" sub="Detailed SKU breakdown" />
            <div style={{ overflowX: 'auto' }}>
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
          </div>
        )}

        {/* ── SaaS Hub Hub & Transaction Path Way ── */}
        {!isExporting && activeTab === "saas" && (
          isDemoMode ? (
            <div className="page-container">
               <SectionHeader title="Membership & SaaS Hub" subtitle="Growth tiers and unified transactional intelligence" badge="Demo Access" />
               <SaaSMembership styles={{ isDemoMode }} activePlan={activePlan} />
            </div>
          ) : (
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

              <div className="dash-flex-responsive" style={{ display: "flex", justifyContent: "space-between", position: "relative", marginTop: 60, paddingBottom: 20 }}>
                <div className="dash-path-line" style={{ position: "absolute", top: 24, left: 40, right: 40, height: 2, background: "rgba(255,255,255,0.1)", zIndex: 0 }} />
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

            <div className="dash-grid-2">
              {/* ── Platform Connectivity Matrix ── */}
              <div style={{ gridColumn: "1 / -1", ...styles.card }}>
                <SectionHeader title="🌐 External Platform Connectivity" sub="Real-time synchronization status for unified commerce" />
                <div className="dash-grid-4" style={{ marginTop: 12 }}>
                  {connectivity.map((p, i) => (
                    <div key={i} style={{ padding: 16, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", position: "relative" }}>
                      <div style={{ fontSize: 24, marginBottom: 12 }}>{p.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>ID: {p.id}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Badge label={p.status} color={p.status === "Live" ? GREEN : p.status === "Syncing" || p.status === "Connecting" ? BRAND : "#94a3b8"} />
                        <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>{p.latency > 0 ? `${p.latency}ms` : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── API Access Hub ── */}
              <div style={styles.card}>
                <SectionHeader title="🛠️ API Developer Hub" sub="Manage external data hooks" />
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#64748b", display: "block", marginBottom: 6 }}>PRIMARY API KEY</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input readOnly type="text" value="sk_live_7x88s...992jk0" style={{ ...styles.select, flex: 1, fontFamily: "monospace", background: "#f1f5f9" }} />
                      <button style={{ padding: "8px 12px", background: BRAND, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => alert("API key regenerated successfully.")}>Rotate</button>
                    </div>
                  </div>
                  <div style={{ padding: 14, background: BRAND + "08", borderRadius: 10, border: `1px dashed ${BRAND}40` }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: BRAND, marginBottom: 4 }}>Webhook Endpoint</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>https://api.selleriq.pro/v1/hooks/events</div>
                  </div>
                </div>
              </div>

              {/* ── Quota Intelligence ── */}
              <div style={styles.card}>
                <SectionHeader title="📊 Quota Intelligence" sub="Allocation vs. Actual usage" />
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 12 }}>
                  {[
                    { label: "Data Parsing Volume", used: 12, limit: 50, unit: "MB", color: BRAND },
                    { label: "Monthly API Calls", used: 4200, limit: 10000, unit: "reqs", color: PURPLE },
                    { label: "Active User Seats", used: 4, limit: 10, unit: "users", color: TEAL },
                  ].map((q, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{q.label}</span>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{q.used}/{q.limit} {q.unit}</span>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${(q.used/q.limit)*100}%`, background: q.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Unified Pipeline Log ── */}
              <div style={{ gridColumn: "1 / -1", ...styles.card }}>
                <SectionHeader title="📜 Unified Pipeline Activity" sub="Stateless engine execution feed" />
                <div style={{ height: 160, overflowY: "auto", background: "#0f172a", borderRadius: 10, padding: 16, border: "1px solid #1e293b", marginTop: 12, fontFamily: "monospace" }}>
                  {[
                    { t: "14:22:01", msg: "AMZ-MTR: successfully pulled delta payload (S_ORD_88x)", color: GREEN },
                    { t: "14:21:58", msg: "RISK-ENGINE: analyzing transaction vectors for batch ID: 9918", color: BRAND },
                    { t: "14:21:44", msg: "TAX-COMPLIANCE: auto-calculating GST liability for 12 SKU groups", color: TEAL },
                    { t: "14:21:30", msg: "SYSTEM: routine synchronization cycle initiated", color: "#94a3b8" },
                    { t: "14:20:12", msg: "AUTH: session renewed for primary organizational admin", color: PURPLE },
                  ].map((log, i) => (
                    <div key={i} style={{ fontSize: 11, marginBottom: 6, display: "flex", gap: 12 }}>
                      <span style={{ color: "#475569" }}>[{log.t}]</span>
                      <span style={{ color: log.color }}>{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            ) : (
              <UpgradeBanner feature="SaaS Hub & Transaction Pathway" requiredPlan="Enterprise" color="#f59e0b" icon="💎" />
            )
        )
        )}

        {(activeTab === "forecast" || isExporting) && stats && (
          <div className="page-container" style={{ marginTop: isExporting ? 60 : 0 }}>
            {isExporting && <h2 style={{ fontSize: 28, borderBottom: "4px solid #2563eb", paddingBottom: 10, marginBottom: 24, color: "#0f172a" }}>6. Algorithmic Forecasting</h2>}
            {canAccess('pro') ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "7-Day Forecast", value: fmt(stats.forecast7), icon: "📅", color: BRAND, sub: `~${fmt((stats.forecast7 || 0) / 7)}/day` },
                    { label: "30-Day Forecast", value: fmt(stats.forecast30), icon: "📆", color: PURPLE, sub: `~${fmt((stats.forecast30 || 0) / 30)}/day` },
                    { label: "90-Day Forecast", value: fmt(stats.forecast90), icon: "🗓️", color: GREEN, sub: "3-month outlook" },
                    { label: "Projected Annual", value: fmt((stats.forecast90 || 0) * 4), icon: "🚀", color: TEAL, sub: "Run-rate estimate" },
                  ].map((m, i) => (
                    <div key={i} style={{ ...styles.card, borderTop: `3px solid ${m.color}` }}>
                      <div style={{ fontSize: 26, marginBottom: 6 }}>{m.icon}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: m.color, marginBottom: 4 }}>{m.value}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>

                <div style={{ ...styles.card, marginBottom: 24 }}>
                  <SectionHeader title="📈 Historical Trend & Forward Projection" sub="Weekly actual revenue with momentum-modeled projection" />
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      ...(stats.weeklySales || []).map((w, i) => ({ ...w, name: w.week || `W${i+1}` })),
                      ...[1, 2, 3, 4].map(i => ({ name: `Proj+W${i}`, projected: Math.round((stats.forecast7 || 0) * i * 0.9) }))
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip formatter={(v, n) => [fmt(v), n === "revenue" ? "Actual Revenue" : "Projected"]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      <Line type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} name="revenue" />
                      <Line type="monotone" dataKey="projected" stroke={PURPLE} strokeWidth={2} strokeDasharray="5 3" dot={false} name="projected" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", gap: 20, marginTop: 10, justifyContent: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}><span style={{ display: "inline-block", width: 24, height: 3, background: BRAND, borderRadius: 2 }} /> Actual Revenue</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}><span style={{ display: "inline-block", width: 24, height: 3, background: PURPLE, borderRadius: 2 }} /> Projected</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div style={styles.card}>
                    <SectionHeader title="⚡ Top SKU Velocity" sub="Fastest-moving products by daily dispatch rate" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                      {(stats.skuVelocity || []).slice(0, 5).map((s, i) => {
                        const maxV = stats.skuVelocity[0]?.dailyVelocity || 1;
                        const pct = Math.min(100, ((s.dailyVelocity || 0) / maxV) * 100);
                        const cols = [BRAND, PURPLE, GREEN, TEAL, ACCENT];
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: cols[i] + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: cols[i], flexShrink: 0 }}>#{i+1}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{s.sku || "Unknown SKU"}</div>
                              <div style={{ height: 5, background: "#f1f5f9", borderRadius: 4 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: cols[i], borderRadius: 4, transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", flexShrink: 0 }}>{(s.dailyVelocity || 0).toFixed(1)}/d</div>
                          </div>
                        );
                      })}
                      {(!stats.skuVelocity || stats.skuVelocity.length === 0) && <div style={{ color: "#94a3b8", fontSize: 13 }}>No SKU velocity data available.</div>}
                    </div>
                  </div>

                  <div style={styles.card}>
                    <SectionHeader title="🎯 Actionable Insights" sub="AI-powered strategic recommendations" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                      {[
                        { icon: "📦", color: GREEN, title: "Restock Alert", body: `Top SKU "${stats.skuVelocity?.[0]?.sku || "—"}" moving at ${(stats.skuVelocity?.[0]?.dailyVelocity || 0).toFixed(1)}/day. Plan 30-day safety stock now.` },
                        { icon: "💰", color: BRAND, title: "Revenue Momentum", body: `30D projection ${fmt(stats.forecast30)} signals ${(stats.forecast30 || 0) > (stats.totalRevenue || 0) ? "📈 growing" : "📉 softening"} demand.` },
                        { icon: "🌍", color: PURPLE, title: "Regional Opportunity", body: `${stats.stateList?.[0]?.state || "Top state"} leads revenue. Targeted regional promos can amplify momentum.` },
                        { icon: "⚠️", color: RED, title: "Return Rate Watch", body: `Rate at ${parseFloat(stats.returnRate || 0).toFixed(1)}%. ${parseFloat(stats.returnRate) > 10 ? "⛔ Above threshold — investigate top-returning SKUs." : "✅ Healthy. Continue monitoring."}` },
                      ].map((ins, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: ins.color + "08", borderRadius: 10, borderLeft: `3px solid ${ins.color}` }}>
                          <div style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: ins.color, marginBottom: 2 }}>{ins.title}</div>
                            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{ins.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <UpgradeBanner feature="Revenue Forecasting & Predictions" requiredPlan="Pro" color="#a855f7" icon="📈" />
            )}
          </div>
        )}

      {/* 🏢 ABOUT US PAGE */}
      {!isExporting && activeTab === "about" && (
        <div className="page-container" style={{ padding: "0", width: "100%", marginTop: 20 }}>
          
          <div className="glass" style={{ padding: "50px", borderRadius: 32, textAlign: 'center', marginBottom: 32, borderTop: `4px solid ${BRAND}`, background: 'white' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: `${BRAND}15`, color: BRAND, borderRadius: 100, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', marginBottom: 24 }}>
              <Shield size={16} /> Company Overview
            </div>
            <h2 style={{ fontSize: 42, fontWeight: 900, marginBottom: 20, color: "#0f172a", letterSpacing: '-1px' }}>Empowering Enterprise Intelligence</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#475569", maxWidth: 700, margin: '0 auto' }}>
              SellerIQ Pro is a premier data analytics engine developed exclusively to bridge the gap between massive eCommerce datasets and actionable enterprise decision-making. 
              Our mission is to arm brands with the fastest, most secure, and most intelligent toolkit to dissect their marketplace and B2B pipelines.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            <div className="glass" style={{ padding: '40px', borderRadius: 24, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ padding: 16, background: `${BRAND}10`, width: 'fit-content', borderRadius: 16, marginBottom: 24, color: BRAND }}>
                <TrendingUp size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>Our Vision</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>To become the undisputed global standard in AI-driven unified commerce intelligence by replacing manual spreadsheets with automated truth engines. We process data at planetary scale.</p>
            </div>
            
            <div className="glass" style={{ padding: '40px', borderRadius: 24, border: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ padding: 16, background: `${GREEN}10`, width: 'fit-content', borderRadius: 16, marginBottom: 24, color: GREEN }}>
                <Shield size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#0f172a' }}>Security First</h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>Our SaaS algorithms process all analytical datasets statelessly. We enforce heavy encryption pipelines and SOC2 protocols to guarantee your private financial vectors remain completely secure.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { stat: "99.9%", label: "MTR Reconciliation Accuracy" },
              { stat: "0ms", label: "Stateless Data Retention" },
              { stat: "500+", label: "Global Enterprise Clients" }
            ].map((s, i) => (
               <div key={i} className="glass" style={{ padding: '30px', borderRadius: 20, textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                 <div style={{ fontSize: 32, fontWeight: 900, color: BRAND, letterSpacing: '-1px', marginBottom: 8 }}>{s.stat}</div>
                 <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
               </div>
            ))}
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
  const [showLanding, setShowLanding] = useState(() => !sessionStorage.getItem('siq_role'));
  const [loginView, setLoginView] = useState("plans");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoBlockReason, setDemoBlockReason] = useState(null);
  const [ingestion, setIngestion] = useState({ loading: false, msg: "", progress: 0 });
  // ── Separate ingestion state for demo – never shared with main upload ──────
  const [demoIngestion, setDemoIngestion] = useState({ loading: false, msg: "", progress: 0 });
  const [planStatus, setPlanStatus] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('siq_plan_status') || 'null'); } catch { return null; }
  });
  const [expiredSession, setExpiredSession] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [demoUploadCount, setDemoUploadCount] = useState(() => parseInt(sessionStorage.getItem('siq_demo_used') || '0', 10));

  const handleGoogleSuccess = async (response) => {
    try {
      // Instead of logging in immediately, we just want to fetch user info to prefill registration
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${response.access_token}`);
      const userInfo = await res.json();
      
      if (userInfo && userInfo.email) {
        setPrefillData({
          name: userInfo.name,
          email: userInfo.email
        });
        setLoginView("plans");
        setShowLanding(false);
        window.location.hash = 'login';
      }
    } catch (e) {
      alert("Failed to fetch Google profile info.");
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (error) => console.log('Login Failed:', error)
  });

  // ── Plan Expiry Polling ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userRole || userRole === 'admin' || isDemoMode) return;

    const checkPlanStatus = async () => {
      const token = sessionStorage.getItem('siq_auth_token');
      if (!token) return;
      try {
        const res = await fetch('/api/v1/auth/plan-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setPlanStatus(data);
        sessionStorage.setItem('siq_plan_status', JSON.stringify(data));

        if (data.status === 'expired') {
          // Force logout and show expired screen
          sessionStorage.clear();
          setExpiredSession(true);
          setUserRole(null);
          setLoginView('user_login');
          setShowLanding(false);
        }
      } catch (e) {
        console.warn('[PlanStatus] Poll failed:', e);
      }
    };

    checkPlanStatus(); // immediate check on login
    const interval = setInterval(checkPlanStatus, 60 * 1000); // every 60s
    return () => clearInterval(interval);
  }, [userRole, isDemoMode]);

  // ── Expiry Warning Banner ────────────────────────────────────────────────
  const expiryBanner = (planStatus && (planStatus.status === 'expiring_soon') && userRole && !isDemoMode) ? (
    <div id="plan-expiry-warning" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99998,
      background: 'linear-gradient(90deg, #92400e, #d97706, #92400e)',
      backgroundSize: '200% 100%',
      animation: 'gradientSlide 3s linear infinite',
      color: '#fff', padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
      boxShadow: '0 4px 20px rgba(217,119,6,0.5)'
    }}>
      <style>{`@keyframes gradientSlide { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }`}</style>
      <span style={{ fontSize: 20 }}>⏰</span>
      <span>
        ⚠️ Your <strong style={{ textTransform: 'uppercase' }}>{planStatus.plan}</strong> plan expires in{' '}
        <strong>{planStatus.minutes_remaining} minute{planStatus.minutes_remaining !== 1 ? 's' : ''}</strong>!
        {' '}Recharge now to avoid losing access.
      </span>
      <button
        onClick={() => { sessionStorage.clear(); setUserRole(null); setLoginView('plans'); setShowLanding(false); window.location.hash = 'login'; }}
        style={{ padding: '6px 18px', borderRadius: 8, background: '#fff', color: '#92400e', border: 'none', fontWeight: 900, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}
      >
        🔄 Recharge Now
      </button>
    </div>
  ) : null;

  // ── MAIN upload handler (authenticated users only, never demo) ───────────
  const handleFileSelection = async (file) => {
    if (!file || ingestion.loading) return;
    setIngestion({ loading: true, msg: "Initializing engine...", progress: 5 });
    try {
      const res = await analyzeReport(file, (pct) => {
        setIngestion(prev => ({ ...prev, progress: Math.max(prev.progress, pct), msg: pct < 100 ? "Syncing data blocks..." : "Analyzing patterns..." }));
      });
      setIngestion({ loading: false, msg: "Success", progress: 100 });
      setState({ 
        rawData: res.rawData, 
        analysis: res.analysis, 
        filename: file.name, 
        source: res.source || 'amazon', 
        session_id: res.session_id, 
        fraud: res.analysis?.fraud 
      });
      window.location.hash = 'overview';
    } catch (err) {
      console.error("Ingestion failed:", err);
      setIngestion({ loading: false, msg: err.response?.data?.detail || "Analysis failed. Ensure valid MTR format.", progress: 0 });
    }
  };

  // ── DEMO upload handler (guest/demo mode only, fully isolated) ────────────
  const handleDemoFileSelection = async (file) => {
    if (!file || demoIngestion.loading) return;
    // Enforce demo limit: only 1 upload per session
    if (demoUploadCount >= 1) {
      setDemoBlockReason('limit_reached');
      return;
    }
    setDemoUploadCount(prev => prev + 1);
    sessionStorage.setItem('siq_demo_used', '1');
    setDemoIngestion({ loading: true, msg: "Initializing engine...", progress: 5 });
    try {
      const res = await analyzeReport(file, (pct) => {
        setDemoIngestion(prev => ({ ...prev, progress: Math.max(prev.progress, pct), msg: pct < 100 ? "Syncing data blocks..." : "Analyzing patterns..." }));
      });
      setDemoIngestion({ loading: false, msg: "Success", progress: 100 });
      setState({
        rawData: res.rawData,
        analysis: res.analysis,
        filename: file.name,
        source: res.source || 'amazon',
        session_id: res.session_id,
        fraud: res.analysis?.fraud
      });
      window.location.hash = 'overview';
    } catch (err) {
      console.error("Demo ingestion failed:", err);
      setDemoIngestion({ loading: false, msg: err.response?.data?.detail || "Analysis failed. Ensure valid MTR format.", progress: 0 });
    }
  };

  const demoLimitOverlay = demoBlockReason ? (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: "rgba(10, 15, 30, 0.95)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ background: "#1e293b", padding: 40, borderRadius: 24, textAlign: "center", maxWidth: 450, border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏱️</div>
        <h2 style={{ fontSize: 24, color: "#fff", marginBottom: 16, fontWeight: 800 }}>Demo Limit Reached</h2>
        <p style={{ color: "#94a3b8", marginBottom: 32, lineHeight: 1.6 }}>
          {demoBlockReason === 'timeout' 
            ? "Your 1-minute demo preview has expired." 
            : "Your free credit is over. Please upgrade the plan."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => {
             googleLogin(); // Triggers the onboarding Google Auth
          }} style={{ padding: "14px 20px", borderRadius: 12, background: BRAND, color: "#fff", fontWeight: 800, border: "none", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Upgrade Now
          </button>
          <button onClick={() => {
              if (demoBlockReason === 'timeout') {
                  sessionStorage.clear();
                  window.location.hash = 'home';
              } else {
                  setDemoBlockReason(null);
              }
          }} style={{ padding: "14px 20px", borderRadius: 12, background: "transparent", color: "#94a3b8", fontWeight: 700, border: "1px solid #334155", cursor: "pointer" }}>
            {demoBlockReason === 'timeout' ? "Back to Home Page" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

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
      if (hash === 'home' || hash === '') {
        if (!userRole) setShowLanding(true);
        setIsDemoMode(false);
        setShowDemoModal(false);
      } else if (hash === 'login') {
         setShowLanding(false);
         setUserRole(null);
         setIsDemoMode(false);
         setShowDemoModal(false);
         sessionStorage.clear();
      } else if (hash === 'upload') {
         // Entering main upload: always exit demo mode and reset demo state
         setIsDemoMode(false);
         setDemoIngestion({ loading: false, msg: '', progress: 0 });
         setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null, fraud: null });
      } else if (hash === 'demo') {
         // Entering demo: reset main ingestion so it never bleeds into demo
         setIsDemoMode(true);
         setActivePlan('pro');
         setShowLanding(false);
         setState({ rawData: null, analysis: null, filename: null });
         setIngestion({ loading: false, msg: '', progress: 0 });
         setShowDemoModal(false);
      }
    };
    window.addEventListener('hashchange', handleNavigation);
    
    // Initial state setup
    const initialHash = window.location.hash.replace('#', '');
    
    if (!initialHash) {
      window.location.hash = userRole ? 'upload' : 'home';
    } else {
      handleNavigation();
    }
    
    return () => window.removeEventListener('hashchange', handleNavigation);
  }, [userRole]);

  // Demo Completion Logic: Trigger modal after 20s of viewing analysis
  useEffect(() => {
    let timer;
    if (isDemoMode && state.rawData && !demoBlockReason) {
      timer = setTimeout(() => {
        setDemoBlockReason('timeout');
      }, 60000);
    }
    return () => clearTimeout(timer);
  }, [isDemoMode, state.rawData, demoBlockReason]);

  // Show landing page for unauthenticated users
  if (showLanding && !userRole) {
    return (
      <LandingPage
        onGetStarted={() => {
          window.location.hash = 'demo';
        }}
        onTryFree={() => {
          window.location.hash = 'demo';
        }}
        onLogin={() => {
          setLoginView("user_login");
          setShowLanding(false);
          window.location.hash = 'login';
        }}
        onGoogleSuccess={handleGoogleSuccess}
      />
    );
  }

  // Logic: Show login if not logged in AND NOT currently in a guest trial flow
  const isGuestTryingFree = !userRole && (isDemoMode || window.location.hash.toLowerCase().includes('upload') || window.location.hash.toLowerCase().includes('demo'));
  
  if (!userRole && !isGuestTryingFree) {
    return <LoginSection
      initialView={expiredSession ? 'expired_redirect' : loginView}
      prefillData={prefillData}
      onLogin={(role, plan, usageStats, initialPlanStatus) => {
        setUserRole(role || 'user');
        if (plan) setActivePlan(plan);
        if (initialPlanStatus) setPlanStatus(initialPlanStatus);
        setExpiredSession(false);
        window.location.hash = role === 'admin' ? 'admin' : 'upload';
      }}
    />;
  }
  
  if (userRole === 'admin') {
    return <AdminPanel onLogout={() => {
      setUserRole(null);
      window.location.hash = 'login';
    }} />;
  }
  
  if (!state.rawData) {
    if (isDemoMode) {
      return (
        <>
          {expiryBanner}
          <div style={{ paddingTop: expiryBanner ? 48 : 0 }}>
            <DemoUpload 
              onFileSelect={handleDemoFileSelection}
              ingestionStatus={demoIngestion}
              onLimitHit={() => setDemoBlockReason('limit_reached')}
            />
          </div>
          {demoLimitOverlay}
        </>
      );
    }

    return (
      <>
        {expiryBanner}
        <div style={{ paddingTop: expiryBanner ? 48 : 0 }}>
          <UploadSection 
            activePlan={activePlan} 
            onFileSelect={handleFileSelection} 
            ingestionStatus={ingestion}
          />
        </div>
      </>
    );
  }

  if (state.source === 'shopify') {
    return (
      <>
        {expiryBanner}
        <div style={{ paddingTop: expiryBanner ? 48 : 0 }}>
          <ShopifyDashboard rawData={state.rawData} filename={state.filename} onReset={() => {
            setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null });
            window.location.hash = 'upload';
          }} />
        </div>
      </>
    );
  }

  if (state.source === 'custom') {
    return (
      <>
        {expiryBanner}
        <div style={{ paddingTop: expiryBanner ? 48 : 0 }}>
          <ERPDashboard rawData={state.rawData} filename={state.filename} onReset={() => {
            setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null });
            window.location.hash = 'upload';
          }} />
        </div>
      </>
    );
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
      {expiryBanner}
      <div style={{ paddingTop: expiryBanner ? 48 : 0 }}>
        <Dashboard 
          rawData={state.rawData} 
          filename={state.filename} 
          source={state.source}
          activePlan={activePlan} 
          session_id={state.session_id}
          fraudData={state.fraud}
          isDemoMode={isDemoMode}
          onReset={(fileOrEvent) => {
            // Signal from Sidebar Quick Upload in demo mode → show upgrade overlay
            if (fileOrEvent === '__demo_limit__') {
              setDemoBlockReason('limit_reached');
              return;
            }
            if (fileOrEvent instanceof File) {
              return handleFileSelection(fileOrEvent);
            }
            setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null, fraud: null });
            window.location.hash = isDemoMode ? 'demo' : 'upload';
          }}
          onLogout={() => {
            sessionStorage.clear();
            setUserRole(null);
            setActivePlan('starter');
            setIsDemoMode(false);
            setShowLanding(false);
            setState({ rawData: null, analysis: null, filename: null, source: null, session_id: null, fraud: null });
            window.location.hash = 'login';
          }}
        />
      </div>
      {demoLimitOverlay}
    </>
  );
}

export default function App() {
  const GOOGLE_CLIENT_ID = "505753164861-3s7egj0sp4c2pg8t9r743dpqeq1jib70.apps.googleusercontent.com";
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
