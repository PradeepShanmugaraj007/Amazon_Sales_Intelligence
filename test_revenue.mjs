// ─── Revenue Calculation Unit Test ───────────────────────────────────────────
// Mirrors the EXACT logic in frontend/src/utils.js
// Run with: node test_revenue.mjs
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';

// ── Replicate parseAmount from utils.js ──────────────────────────────────────
const parseAmount = (val) => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

// ── Replicate processData revenue section from utils.js ──────────────────────
const calcRevenue = (rows) => {
  const rowsSafe = (rows || []).filter(Boolean);

  const shipments = rowsSafe.filter(r => {
    const type = (r["Transaction Type"] || r["type"] || "").toLowerCase();
    if (type.includes("cancel")) return false;
    return type === "shipment" || type === "sale" || type.includes("order") || type.includes("shipped");
  });

  const returns = rowsSafe.filter(r => {
    const type = (r["Transaction Type"] || r["type"] || "").toLowerCase();
    const desc = (r["Item Description"] || "").toLowerCase();
    return type.includes("return") || type.includes("refund") || type.includes("adjustment") || desc.includes("refund") || desc.includes("returned");
  });

  const totalRevenue = 
    shipments.reduce((s, r) => s + parseAmount(r["Invoice Amount"]), 0) +
    returns.reduce((s, r) => s + parseAmount(r["Invoice Amount"]), 0);

  const totalOrders = shipments.length + returns.length;
  const avgOrderValue = shipments.length ? totalRevenue / shipments.length : 0;

  return { totalRevenue, totalOrders, shipmentCount: shipments.length, returnCount: returns.length, avgOrderValue };
};

// ── Test 1: Simple 3-row sanity check ────────────────────────────────────────
console.log("\n═══════════════════════════════════════════");
console.log("TEST 1: Simple 3-row sanity check");
console.log("═══════════════════════════════════════════");
const simpleRows = [
  { "Transaction Type": "Shipment", "Invoice Amount": "553082.88" },
  { "Transaction Type": "Refund",   "Invoice Amount": "-49155.43" },
  { "Transaction Type": "Cancel",   "Invoice Amount": "0" },
];
const r1 = calcRevenue(simpleRows);
console.log(`  Shipments:    ${r1.shipmentCount}   (expected: 1)`);
console.log(`  Returns:      ${r1.returnCount}   (expected: 1)`);
console.log(`  Total Orders: ${r1.totalOrders}   (expected: 2)`);
console.log(`  Total Revenue: ₹${r1.totalRevenue.toFixed(2)}   (expected: ₹503927.45)`);
const pass1 = Math.abs(r1.totalRevenue - 503927.45) < 0.01;
console.log(`  Result: ${pass1 ? "✅ PASS" : "❌ FAIL"}\n`);

// ── Test 2: parseAmount handles comma-formatted and plain values ──────────────
console.log("═══════════════════════════════════════════");
console.log("TEST 2: parseAmount formatting edge cases");
console.log("═══════════════════════════════════════════");
const cases = [
  ["299",        299],
  ["1,092",      1092],
  ["-49155.43",  -49155.43],
  ["5,53,082.88",553082.88],
  [null,         0],
  ["",           0],
  [0,            0],
  [299.5,        299.5],
  ["₹1,234",     1234],
];
let pass2 = true;
for (const [input, expected] of cases) {
  const got = parseAmount(input);
  const ok = Math.abs(got - expected) < 0.001;
  if (!ok) pass2 = false;
  console.log(`  parseAmount(${JSON.stringify(input)}) = ${got}  →  ${ok ? "✅" : "❌ expected " + expected}`);
}
console.log(`  Result: ${pass2 ? "✅ PASS" : "❌ FAIL"}\n`);

// ── Test 3: Read actual B2C CSV if it exists ──────────────────────────────────
const csvPath = "C:\\Users\\ajaia\\OneDrive\\Documents\\MTR_B2C-MARCH-2026-AH2HK602IW3Q.csv";
console.log("═══════════════════════════════════════════");
console.log("TEST 3: Real B2C CSV file validation");
console.log("═══════════════════════════════════════════");
if (fs.existsSync(csvPath)) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (parts[idx] || '').trim(); });
    rows.push(obj);
  }
  const r3 = calcRevenue(rows);
  const totalLines = lines.length - 1;
  console.log(`  Total CSV rows:   ${totalLines}`);
  console.log(`  Shipments found:  ${r3.shipmentCount}`);
  console.log(`  Returns found:    ${r3.returnCount}`);
  console.log(`  Total Orders:     ${r3.totalOrders}`);
  console.log(`  Total Revenue:    ₹${r3.totalRevenue.toFixed(2)}`);
  console.log(`  Avg Order Value:  ₹${r3.avgOrderValue.toFixed(2)}`);
  // Sample some Invoice Amount values to see what we're parsing
  const sample = rows.slice(0, 3).map(r => ({ type: r["Transaction Type"], amt: r["Invoice Amount"] }));
  console.log(`\n  Sample rows:`, JSON.stringify(sample, null, 2));
} else {
  console.log(`  CSV not found at: ${csvPath}`);
  console.log(`  (Skipped)`);
}

console.log("\n═══════════════════════════════════════════");
console.log("ALL TESTS COMPLETE");
console.log("═══════════════════════════════════════════\n");
