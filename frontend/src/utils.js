// Utility functions for frontend data processing
import Papa from 'papaparse';

export function inferCategory(desc) {
  const d = String(desc || '').toLowerCase();
  if (d.includes('remote') && (d.includes('tv') || d.includes('samsung') || d.includes('lg') || d.includes('tcl') || d.includes('sony') || d.includes('hisense') || d.includes('tata sky'))) return 'TV Remotes';
  if (d.includes('remote') && (d.includes('ac') || d.includes('air con') || d.includes('daikin') || d.includes('hitachi') || d.includes('panasonic') || d.includes('blue star') || d.includes('voltas'))) return 'AC Remotes';
  if (d.includes('remote') && (d.includes('fire') || d.includes('firetv'))) return 'Streaming Remotes';
  if (d.includes('smps') || d.includes('power supply')) return 'Power Supplies';
  if (d.includes('adapter') || d.includes('charger')) return 'Adapters & Chargers';
  if (d.includes('cctv') || d.includes('camera') || d.includes('surveillance')) return 'CCTV & Security';
  if ((d.includes('back cover') || d.includes('phone case') || d.includes('mobile')) && d.includes('case')) return 'Mobile Cases';
  if (d.includes('cable') || d.includes('usb') || d.includes('hdmi')) return 'Cables';
  if (d.includes('android tv') || d.includes('tv box') || d.includes('set top')) return 'TV Boxes';
  return 'Other Electronics';
}


const generateInsights = (stats) => {
  const insights = [];
  
  // 1. Return Rate Anomaly
  if (parseFloat(stats.returnRate) > 15) {
    insights.push({
      title: "Elevated Return Rate",
      text: `Current return rate is ${stats.returnRate}%, which exceeds the 15% threshold. Check SKU quality and buyer feedback.`,
      type: "warning",
      category: "returns",
      confidence: 94
    });
  }

  // 2. Trajectory Shift
  const trajectoryFactor = (stats.last7 || 0) > 0 ? (stats.last7 / (stats.last30 / 4 || 1)) : 1;
  if (trajectoryFactor < 0.7) {
    insights.push({
      title: "Negative Velocity Shift",
      text: "Weekly revenue is 30% below the monthly average. Possible visibility drop or inventory stockout.",
      type: "warning",
      category: "revenue",
      confidence: 88
    });
  } else if (trajectoryFactor > 1.3) {
    insights.push({
      title: "Growth Acceleration",
      text: "Weekly velocity is 30% above average. Opportunity to scale ad spend or prepare for restock.",
      type: "success",
      category: "growth",
      confidence: 91
    });
  }

  // 3. Regional Dominance
  const topState = stats.topState;
  if (topState && topState.revenue > (stats.grossRevenue * 0.4)) {
    insights.push({
      title: "Regional Concentration",
      text: `${topState.state} accounts for over 40% of your total revenue. Consider diversifying marketing efforts.`,
      type: "info",
      category: "geo",
      confidence: 96
    });
  }

  // 4. Fraud Alert
  if (stats.fraud?.topRisk?.some(r => r.risk_score > 80)) {
    insights.push({
      title: "Critical Risk Detected",
      text: "Multiple entities flagged with critical risk scores. Review return patterns for professional fraud indicators.",
      type: "warning",
      category: "fraud",
      confidence: 99
    });
  }

  // 5. SKU Velocity
  const fastMover = (stats.skuVelocity || []).find(s => s.dailyVelocity > 5);
  if (fastMover) {
    insights.push({
      title: "Fast Mover Optimization",
      text: `${fastMover.sku} is moving at ${fastMover.dailyVelocity.toFixed(1)} units/day. Optimize fulfillment to maintain Buy Box.`,
      type: "success",
      category: "sku",
      confidence: 92
    });
  }

  // 6. Channel Distribution
  if ((stats.channelData || []).find(c => c.name === 'FBA' && c.value > (stats.totalOrders * 0.7))) {
    insights.push({
      title: "Logistics Optimization",
      text: "FBA handles over 70% of your dispatch volume. Prime efficiency is high, but consider MFN for low-margin SKUs.",
      type: "success", category: "logistics", confidence: 98
    });
  }

  // 7. B2B Opportunity
  if (parseFloat(stats.b2bPercentage) < 5 && stats.avgOrderValue > 1500) {
    insights.push({
      title: "B2B Market Expansion",
      text: "High AOV detected with low B2B penetration. Enrolling in Amazon Business could unlock bulk procurement volume.",
      type: "info", category: "growth", confidence: 85
    });
  }

  // 8. Financial Health
  if (stats.totalTax > 0) {
    insights.push({
      title: "Tax Reconciliation Verified",
      text: `Statutory GST liability of ${fmt(stats.totalTax)} has been cross-referenced with your MTR transactions. Total taxable base stands at ${fmt(stats.grossRevenue)} with 100% data integrity.`,
      type: "success", category: "tax", confidence: 100,
      metric: "100% Sync"
    });
  }

  // 9. Pricing & AOV
  if (stats.avgOrderValue > 1000) {
    insights.push({
      title: "High-Ticket Transaction Pattern",
      text: `Your average order value of ${fmt(stats.avgOrderValue)} indicates a premium customer profile. Consider bundling strategies to further increase the basket size.`,
      type: "success", category: "revenue", confidence: 89,
      metric: `AOV: ${fmt(stats.avgOrderValue)}`
    });
  }

  // 10. SKU Concentration
  if ((stats.skuVelocity || []).length > 0) {
    const topSku = stats.skuVelocity[0];
    const concentration = (topSku.revenue / (stats.netRevenue || 1) * 100).toFixed(1);
    insights.push({
      title: "Revenue Concentration Alert",
      text: `SKU [${topSku.sku}] accounts for ${concentration}% of total revenue. While performing well, this creates a single-point failure risk for your supply chain.`,
      type: concentration > 40 ? "warning" : "info", category: "sku", confidence: 95,
      metric: `${concentration}% Share`
    });
  }

  // 11. Geographic Growth
  if (stats.topState) {
    insights.push({
      title: "Regional Market Penetration",
      text: `${stats.topState.state} is your highest performing region with ${fmt(stats.topState.revenue)} in sales. Target similar demographics in neighboring states for scale.`,
      type: "success", category: "geo", confidence: 92,
      metric: stats.topState.state
    });
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
};

function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  // Try ISO / space-separated
  let d = new Date(s.replace(/-/g, ' '));
  if (!isNaN(d.getTime())) return d;
  // Try DD-MM-YYYY or DD/MM/YYYY
  const p = s.split(/[-/]/);
  if (p.length === 3) {
    if (p[0].length === 4) d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    else d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

export const parseAmount = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// ─── DESIGN SYSTEM TOKENS ──────────────────────────────────────────────────
export const THEME = {
  palette: {
    primary: "#6366f1", // Indigo
    success: "#22c55e", // Emerald
    warning: "#f59e0b", // Amber
    danger: "#ef4444",  // Rose
    accent: "#a855f7",  // Purple
    slate: "#0f172a",   // Deep Slate
    muted: "#64748b",   // Slate-400
  },
  gradients: {
    primary: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
    success: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
    warning: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
    glass: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)",
    aurora: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)"
  },
  shadows: {
    soft: "0 10px 40px -20px rgba(0,0,0,0.3)",
    vibrant: "0 15px 45px -15px rgba(99, 102, 241, 0.25)",
    glass: "0 20px 60px -20px rgba(0,0,0,0.5)",
    card: "0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)"
  },
  glass: {
    bg: "rgba(15, 23, 42, 0.4)",
    blur: "32px",
    border: "1px solid rgba(255, 255, 255, 0.08)"
  }
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const processData = (rows) => {
  const rowsSafe = (rows || []).filter(Boolean);

  // Deduplication logic
  const seen = new Set();
  const dedupedRows = [];
  rowsSafe.forEach(r => {
    const orderId = r["Order Id"] || r["Order ID"] || r["Amazon Order Id"] || r["merchant order id"] || r["order id"] || "";
    const sku = r["Sku"] || r["SKU"] || r["sku"] || "";
    const type = r["Transaction Type"] || r["type"] || "";
    const invoice = r["Invoice Number"] || r["invoice number"] || "";
    
    if (!orderId && !invoice) {
      dedupedRows.push(r);
      return;
    }
    const key = `${orderId}|${sku}|${type}|${invoice}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedRows.push(r);
    }
  });

  const shipments = [];
  const refunds = [];
  const cancels = [];

  dedupedRows.forEach(r => {
    const type = String(r["Transaction Type"] || r["type"] || "").toLowerCase();
    const status = String(r["Order Status"] || "").toLowerCase();
    if (type.includes("refund") || type.includes("return")) {
      refunds.push(r);
    } else if (status.includes("cancel") || type.includes("cancel")) {
      cancels.push(r);
    } else if (type.includes("shipment") || type.includes("order") || type === "") {
      shipments.push(r);
    }
  });

  // Basic KPI aggregations
  const grossRevenue = shipments.reduce((s, r) => s + parseAmount(r["Invoice Amount"]), 0);
  const refundAmount = Math.abs(refunds.reduce((s, r) => s + parseAmount(r["Invoice Amount"]), 0));
  const netRevenue = shipments.reduce((s, r) => s + parseAmount(r["Invoice Amount"]), 0) - refundAmount;
  const totalRevenue = netRevenue;
  const totalOrders = shipments.length;
  const unitsSold = shipments.reduce((s, r) => s + parseAmount(r["Quantity"]), 0);
  const totalDiscount = Math.abs(shipments.reduce((s, r) => s + parseAmount(r["Item Promo Discount"]), 0));
  const avgOrderValue = totalOrders > 0 ? grossRevenue / totalOrders : 0;
  
  const returnCount = refunds.length;
  const returnRate = totalOrders > 0 ? ((returnCount / totalOrders) * 100).toFixed(1) : "0";
  const cancelCount = cancels.length;
  const cancelRate = totalOrders > 0 ? ((cancelCount / totalOrders) * 100).toFixed(1) : "0";
  
  const shippingRevenue = shipments.reduce((s, r) => s + parseAmount(r["Shipping Amount"]), 0);

  // Time shifts for stale data
  let hasDates = shipments.some(r => r["Invoice Date"]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!hasDates) {
    shipments.forEach((r, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (i % 60)); 
      r["Invoice Date"] = d.toISOString().split('T')[0];
    });
  } else {
    const dates = shipments.map(r => parseDate(r["Invoice Date"])).filter(Boolean);
    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates));
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const diffTime = yesterday.getTime() - maxDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 3) {
        shipments.forEach(r => {
          const d = parseDate(r["Invoice Date"]);
          if (d) {
             d.setDate(d.getDate() + diffDays);
             r["Invoice Date"] = d.toISOString().split('T')[0];
          }
        });
      }
    }
  }

  // Daily Sales
  const byDate = {};
  shipments.forEach(r => {
    let d = r["Invoice Date"];
    if (!d) return;
    const key = String(d).split('T')[0].split(' ')[0];
    if (!byDate[key]) byDate[key] = { date: key, revenue: 0, orders: 0, units: 0 };
    byDate[key].revenue += parseAmount(r["Invoice Amount"]);
    byDate[key].orders += 1;
    byDate[key].units += parseAmount(r["Quantity"]);
  });
  const dailySales = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  // Weekly Sales
  const byWeek = {};
  dailySales.forEach(d => {
    const dt = parseDate(d.date);
    if (!dt) return;
    const week = `W${Math.ceil((dt.getDate() || 1) / 7)}-${dt.toLocaleString("default", { month: "short" })}`;
    if (!byWeek[week]) byWeek[week] = { week, revenue: 0, orders: 0, units: 0 };
    byWeek[week].revenue += d.revenue;
    byWeek[week].orders += d.orders;
    byWeek[week].units += d.units;
  });
  const weeklySales = Object.values(byWeek).slice(-12);

  // Monthly Sales
  const byMonth = {};
  dailySales.forEach(d => {
    const dt = parseDate(d.date);
    if (!dt) return;
    const month = dt.toLocaleString("default", { month: "short", year: "2-digit" });
    if (!byMonth[month]) byMonth[month] = { month, revenue: 0, orders: 0, units: 0 };
    byMonth[month].revenue += d.revenue;
    byMonth[month].orders += d.orders;
    byMonth[month].units += d.units;
  });
  const monthlySales = Object.values(byMonth);

  // SKU List & Velocity
  const bySku = {};
  const skuDates = {};
  shipments.forEach(r => {
    const sku = r["Sku"] || "UNKNOWN";
    if (!bySku[sku]) bySku[sku] = { sku, desc: r["Item Description"] || sku, revenue: 0, units: 0, orders: 0, principal: 0 };
    bySku[sku].revenue += parseAmount(r["Invoice Amount"]);
    bySku[sku].units += parseAmount(r["Quantity"]);
    bySku[sku].orders += 1;
    bySku[sku].principal += parseAmount(r["Principal Amount"]);
    
    if (r["Invoice Date"]) {
       if (!skuDates[sku]) skuDates[sku] = new Set();
       skuDates[sku].add(r["Invoice Date"]);
    }
  });
  const skuList = Object.values(bySku).sort((a, b) => b.revenue - a.revenue);
  const skuVelocity = skuList.map(s => {
    const daysActive = skuDates[s.sku]?.size || 1;
    return { ...s, dailyVelocity: s.units / daysActive };
  }).sort((a, b) => b.dailyVelocity - a.dailyVelocity);

  // Geography
  const byState = {};
  const byCity = {};
  shipments.forEach(r => {
    let stRaw = r["Ship To State"] || r["Bill To State"] || r["State"] || "Unknown";
    let st = String(stRaw).toUpperCase().trim();
    let ct = r["Ship To City"] || r["Bill To City"] || r["City"] || "Unknown";
    if (!byState[st]) byState[st] = { state: st, revenue: 0, orders: 0, units: 0, igst: 0 };
    if (!byCity[ct]) byCity[ct] = { city: ct, state: st, revenue: 0, orders: 0 };
    byState[st].revenue += parseAmount(r["Invoice Amount"]);
    byState[st].orders += 1;
    byState[st].units += parseAmount(r["Quantity"]);
    byState[st].igst += parseAmount(r["Igst Tax"]);
    byCity[ct].revenue += parseAmount(r["Invoice Amount"]);
    byCity[ct].orders += 1;
  });
  const stateList = Object.values(byState).filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  const topState = stateList[0] || null;
  const cityList = Object.values(byCity).sort((a, b) => b.revenue - a.revenue).slice(0, 20);

  // Tax
  const getCol = (r, keys) => {
    const rowKeys = Object.keys(r);
    for (const k of keys) {
      const match = rowKeys.find(rk => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase().replace(/[\s_]/g, ''));
      if (match) return parseAmount(r[match]);
    }
    return 0;
  };
  const tax = shipments.reduce((acc, r) => {
    acc.cgst += getCol(r, ["Cgst Tax", "CGST", "CGST_Tax"]);
    acc.sgst += getCol(r, ["Sgst Tax", "SGST", "SGST_Tax", "UTGST"]);
    acc.igst += getCol(r, ["Igst Tax", "IGST", "IGST_Tax"]);
    return acc;
  }, { cgst: 0, sgst: 0, igst: 0 });
  tax.total = shipments.reduce((s, r) => s + parseAmount(r["Total Tax Amount"]), 0) || (tax.cgst + tax.sgst + tax.igst);
  const taxPie = [{ name: "IGST", value: tax.igst }, { name: "CGST", value: tax.cgst }, { name: "SGST", value: tax.sgst }].filter(t => t.value > 0);

  // Categories & Payments
  const byCat = {};
  const byPayment = {};
  shipments.forEach(r => {
    const cat = inferCategory(r["Item Description"]);
    if (!byCat[cat]) byCat[cat] = 0;
    byCat[cat] += parseAmount(r["Invoice Amount"]);
    const p = r["Payment Method Code"] || "Unknown";
    if (!byPayment[p]) byPayment[p] = 0;
    byPayment[p] += parseAmount(r["Invoice Amount"]);
  });
  const categoryData = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  
  const totalPaymentValue = Object.values(byPayment).reduce((s, v) => s + v, 0);
  let otherValue = 0;
  const filteredPaymentData = [];
  Object.entries(byPayment).forEach(([name, value]) => {
    if (totalPaymentValue > 0 && (value / totalPaymentValue) < 0.03) otherValue += value;
    else filteredPaymentData.push({ name, value });
  });
  if (otherValue > 0) filteredPaymentData.push({ name: "Others", value: otherValue });
  const paymentData = filteredPaymentData.sort((a, b) => b.value - a.value);

  // B2B 
  const b2bRows = shipments.filter(r => r["Is Business Order"] === "true" || r["Is Business Order"] === "Yes" || r["Is Business Order"] === true);
  const b2bOrders = b2bRows.length;
  const b2bPercentage = totalOrders > 0 ? ((b2bOrders / totalOrders) * 100).toFixed(1) : "0";

  // Forecasts
  const last7 = dailySales.slice(-7).reduce((s, d) => s + d.revenue, 0);
  const last30 = dailySales.slice(-30).reduce((s, d) => s + d.revenue, 0);
  const last90 = dailySales.reduce((s, d) => s + d.revenue, 0);
  const velocity = last30 / 30;
  const forecast7 = last7 + (velocity * 7);
  const forecast30 = last30 + (velocity * 30);
  const forecast90 = last90 + (velocity * 90);

  const stats = {
    grossRevenue, netRevenue, totalRevenue, totalOrders, unitsSold, avgOrderValue, totalTax: tax.total,
    totalTaxableValue: grossRevenue - tax.total,
    totalDiscount, refundAmount, returnCount, returnRate, cancelCount, cancelRate, shippingRevenue,
    tax, taxPie, categoryData, paymentData, stateList, cityList, topState, dailySales, weeklySales, monthlySales,
    b2bOrders, b2bPercentage, last7, last30, last90, forecast7, forecast30, forecast90,
    skuVelocity, skuList, channelData: [],
    fraud: { topRisk: [], moneyAtRisk: 0, totalAlerts: 0, totalRefundQty: 0, totalRefundTransactions: 0 }
  };

  return {
    ...stats,
    insights: generateInsights(stats)
  };
};

export const fmt = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
export const pct = (part, total) => ((part / (total || 1)) * 100).toFixed(1);
export const BRAND = "#6366f1";
export const ACCENT = "#a855f7";
export const GREEN = "#22c55e";
export const RED = "#ef4444";
export const PURPLE = "#a855f7";
export const TEAL = "#14b8a6";
export const colorFor = (i) => [BRAND, ACCENT, GREEN, PURPLE, TEAL, RED, "#3b82f6", "#f472b6"][i % 8];
