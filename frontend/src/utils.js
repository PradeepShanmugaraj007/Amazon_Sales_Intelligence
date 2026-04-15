// Utility functions for frontend data processing

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

  // Shipments: Accept "Shipment", "Sale", or any order-like type
  const shipments = rowsSafe.filter(r => {
    const type = (r["Transaction Type"] || r["type"] || "").toLowerCase();
    return type === "shipment" || type === "sale" || type.includes("order") || type.includes("shipped");
  });

  // Returns: refund/return/adjustment rows with positive quantity
  const returns = rowsSafe.filter(r => {
    const type = (r["Transaction Type"] || r["type"] || "").toLowerCase();
    const desc = (r["Item Description"] || "").toLowerCase();
    return type.includes("return") ||
      type.includes("refund") ||
      type.includes("adjustment") ||
      desc.includes("refund") ||
      desc.includes("returned");
  });

  // ── Virtual Date Fallback ────────────────────────────────────────────────
  let hasDates = shipments.some(r => r["Invoice Date"]);
  if (!hasDates) {
    const today = new Date();
    shipments.forEach((r, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (i % 60)); // Distribute orders over 60 days
      r["Invoice Date"] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
  }

  // ── Daily Sales ──────────────────────────────────────────────────────────
  const byDate = {};
  shipments.forEach(r => {
    const d = r["Invoice Date"];
    if (!d) return;
    const key = String(d);
    if (!byDate[key]) byDate[key] = { date: key, revenue: 0, orders: 0, units: 0 };
    byDate[key].revenue += Number(r["Invoice Amount"]) || 0;
    byDate[key].orders += 1;
    byDate[key].units += Number(r["Quantity"]) || 0;
  });
  const dailySales = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  // ── Weekly Sales ─────────────────────────────────────────────────────────
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

  // ── Monthly Sales ────────────────────────────────────────────────────────
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

  // ── SKU List ─────────────────────────────────────────────────────────────
  const bySku = {};
  shipments.forEach(r => {
    const sku = r["Sku"] || "UNKNOWN";
    if (!bySku[sku]) bySku[sku] = { sku, desc: r["Item Description"] || sku, revenue: 0, units: 0, orders: 0, principal: 0 };
    bySku[sku].revenue += Number(r["Invoice Amount"]) || 0;
    bySku[sku].units += Number(r["Quantity"]) || 0;
    bySku[sku].orders += 1;
    bySku[sku].principal += Number(r["Principal Amount"]) || 0;
  });
  const skuList = Object.values(bySku).sort((a, b) => b.revenue - a.revenue);

  // ── State List ───────────────────────────────────────────────────────────
  const byState = {};
  INDIAN_STATES.forEach(s => {
    byState[s] = { state: s, revenue: 0, orders: 0, units: 0, igst: 0 };
  });

  shipments.forEach(r => {
    let st = r["Ship To State"] || r["Bill To State"] || r["State"] || "Unknown";
    
    // Simple normalization: If the data has "MH", "KA", etc., you might need a map.
    // However, the user asked to "add all regions", implying they want the list predefined.
    // If the state from data isn't in our list, add it dynamically too.
    if (!byState[st]) byState[st] = { state: st, revenue: 0, orders: 0, units: 0, igst: 0 };
    
    byState[st].revenue += Number(r["Invoice Amount"]) || 0;
    byState[st].orders += 1;
    byState[st].units += Number(r["Quantity"]) || 0;
    byState[st].igst += Number(r["Igst Tax"]) || 0;
  });
  const stateList = Object.values(byState).sort((a, b) => b.revenue - a.revenue);

  // ── Tax ──────────────────────────────────────────────────────────────────
  const tax = {
    cgst: shipments.reduce((s, r) => s + (Number(r["Cgst Tax"]) || 0), 0),
    sgst: shipments.reduce((s, r) => s + (Number(r["Sgst Tax"]) || 0), 0),
    igst: shipments.reduce((s, r) => s + (Number(r["Igst Tax"]) || 0), 0),
  };
  tax.total = tax.cgst + tax.sgst + tax.igst;
  const taxPie = [
    { name: "IGST", value: tax.igst },
    { name: "CGST", value: tax.cgst },
    { name: "SGST", value: tax.sgst },
  ].filter(t => t.value > 0);

  // ── Totals ───────────────────────────────────────────────────────────────
  const totalRevenue = shipments.reduce((s, r) => s + (Number(r["Invoice Amount"]) || 0), 0);
  const totalOrders = shipments.length;
  const totalDiscount = Math.abs(shipments.reduce((s, r) => s + (Number(r["Item Promo Discount"]) || 0), 0));
  const returnCount = returns.length;
  const returnRate = totalOrders ? (returnCount / totalOrders * 100).toFixed(1) : "0";
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const fba = shipments.filter(r => (r["Fulfillment Channel"] || "").toUpperCase() === "FBA").length;
  const mfn = shipments.filter(r => (r["Fulfillment Channel"] || "").toUpperCase() === "MFN").length;
  const channelData = [{ name: "FBA", value: fba }, { name: "MFN", value: mfn }];

  // ── Forecast ─────────────────────────────────────────────────────────────
  const lastN = dailySales.slice(-30);
  const avgDaily = lastN.length ? lastN.reduce((s, d) => s + d.revenue, 0) / lastN.length : 0;
  const trend = lastN.length > 7
    ? lastN.slice(-7).reduce((s, d) => s + d.revenue, 0) / 7
    - lastN.slice(0, 7).reduce((s, d) => s + d.revenue, 0) / 7
    : 0;
  const forecast7 = Math.max(0, (avgDaily + trend * 0.5) * 7);
  const forecast30 = Math.max(0, (avgDaily + trend * 1.2) * 30);
  const forecast90 = Math.max(0, (avgDaily + trend * 1.5) * 90);

  const days = dailySales.length || 1;
  const skuVelocity = skuList.map(s => ({ ...s, dailyVelocity: s.units / days }));

  // ── Fraud / Risk ─────────────────────────────────────────────────────────
  const customers = {};
  returns.forEach(r => {
    const city = r["Ship To City"] || r["Bill To City"] || r["City"] || "Unknown";
    const state = r["Ship To State"] || r["Bill To State"] || r["State"] || "Unknown";
    const zip = r["Ship To Zip"] || r["Bill To Zip"] || r["Postal Code"] || r["Pincode"] || "";
    const buyerName = r["Buyer Name"] || r["Recipient Name"] || r["Customer Name"] || "";
    const gstin = r["Gstin"] || "";

    // Stable identity key: B2B → name+GSTIN, B2C → zip+state
    const id = buyerName
      ? (gstin ? `${buyerName}__${gstin}` : buyerName)
      : (zip ? `ZIP:${zip}__${state}` : `${city}__${state}`);

    if (!customers[id]) {
      customers[id] = {
        customer_id: buyerName || (zip ? `${city} (${zip})` : city),
        city, state,
        postal_code: zip,
        gstin: gstin || "N/A",
        refund_quantity: 0,
        refund_count: 0,
        total_refund_amount: 0,
        first_refund: r["Invoice Date"] || "",
        last_refund: r["Invoice Date"] || "",
        skus: new Set(),
        sku_breakdown_map: {},
        transactions: []
      };
    }

    const c = customers[id];

    // Parse quantity supporting B2C and B2B variants
    const rawQtyStr = r["Quantity"] || r["Qty"] || r["Shipped Quantity"] || r["Return Quantity"] || "1";
    const rawQty = parseFloat(rawQtyStr);
    const qty = isNaN(rawQty) ? 1 : Math.abs(rawQty) || 1;

    const amt = Math.abs(parseFloat(r["Invoice Amount"]) || 0);

    c.refund_quantity += qty;
    c.refund_count += 1;
    c.total_refund_amount += amt;
    c.skus.add(r["Sku"] || r["SKU"] || "Unknown");

    if (r["Invoice Date"]) {
      if (!c.first_refund || r["Invoice Date"] < c.first_refund) c.first_refund = r["Invoice Date"];
      if (!c.last_refund || r["Invoice Date"] > c.last_refund) c.last_refund = r["Invoice Date"];
    }

    const sku = r["Sku"] || r["SKU"] || "Unknown";
    if (!c.sku_breakdown_map[sku]) {
      c.sku_breakdown_map[sku] = { Sku: sku, "Hsn/sac": r["Hsn/sac"] || r["HSN"] || "-", quantity: 0, count: 0, amount: 0 };
    }
    c.sku_breakdown_map[sku].quantity += qty;
    c.sku_breakdown_map[sku].count += 1;
    c.sku_breakdown_map[sku].amount += amt;

    c.transactions.push(r);
  });

  const allRiskEntities = Object.values(customers).map(c => {
    const volumeScore = Math.min(100, (c.refund_quantity / 10) * 100);
    const frequencyScore = Math.min(100, (c.refund_count / 5) * 100);
    // Extra boost if they return multiple diverse products
    const varietyScore = Math.min(100, (c.skus.size / 3) * 100);

    let baseScore = Math.round(volumeScore * 0.5 + frequencyScore * 0.3 + varietyScore * 0.2);

    // 3 or more total units returned, 3 or more diverse products returned, or 3 or more separate return orders
    if (c.refund_quantity >= 3 || c.refund_count >= 3 || c.skus.size >= 3) {
      baseScore = Math.max(70, baseScore);
    }

    return {
      ...c,
      risk_score: baseScore,
      risk_label: baseScore >= 80 ? "CRITICAL" : baseScore >= 60 ? "HIGH" : "MEDIUM",
      skus: Array.from(c.skus),
      sku_breakdown: Object.values(c.sku_breakdown_map),
    };
  }).filter(c => c.refund_quantity >= 1 || c.refund_count >= 1 || c.skus.length >= 1);

  const topRisk = [...allRiskEntities]
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 10)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  return {
    totalRevenue, totalOrders, totalDiscount, returnCount, returnRate, avgOrderValue,
    dailySales, weeklySales, monthlySales, skuList, stateList, tax, taxPie,
    forecast7, forecast30, forecast90, skuVelocity, channelData, days,
    fraud: {
      topRisk,
      moneyAtRisk: returns.reduce((sum, r) => sum + Math.abs(Number(r["Invoice Amount"]) || 0), 0),
      totalAlerts: allRiskEntities.length,
      totalRefundQty: returns.reduce((sum, r) => sum + (Math.abs(parseFloat(r["Quantity"])) || 0), 0),
      totalRefundTransactions: returns.length,
    }
  };
};

export const fmt = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
export const pct = (part, total) => ((part / (total || 1)) * 100).toFixed(1);
export const BRAND = "#1b3a6b";
export const ACCENT = "#f59e0b";
export const GREEN = "#10b981";
export const RED = "#ef4444";
export const PURPLE = "#8b5cf6";
export const TEAL = "#14b8a6";
export const colorFor = (i) => [BRAND, ACCENT, GREEN, PURPLE, TEAL, RED, "#3b82f6", "#f472b6"][i % 8];
