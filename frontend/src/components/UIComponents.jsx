import React from "react";
import { fmt, GREEN, RED, BRAND } from "../utils";

export const KpiCard = ({ label, value, sub, color, icon, trend }) => (
  <div style={{
    background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(24px)", borderRadius: 16, padding: "20px 24px",
    boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)", border: "1px solid #ffffff", borderLeft: `6px solid ${color}`,
    display: "flex", flexDirection: "column", gap: 4
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{icon}</div>
      {trend && <span style={{ fontSize: 13, background: trend >= 0 ? "#dcfce7" : "#fee2e2", padding: "4px 8px", borderRadius: 8, color: trend >= 0 ? GREEN : RED, fontWeight: 800 }}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%</span>}
    </div>
    <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 8, letterSpacing: "-0.01em" }}>{value}</div>
    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    {sub && <div style={{ fontSize: 12, color: "#94a3b8" }}>{sub}</div>}
  </div>
);

export const SectionHeader = ({ title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>{title}</h2>
    {sub && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>{sub}</p>}
  </div>
);

export const Badge = ({ label, color }) => (
  <span style={{ background: color + "15", color: color, fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 20, border: `1px solid ${color}30` }}>{label}</span>
);

export const InsightCard = ({ icon, title, text, color, action }) => (
  <div style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", borderRadius: 16, padding: 20, border: "1px solid #ffffff", borderLeft: `4px solid ${color}`, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)", display: "flex", gap: 16 }}>
    <span style={{ fontSize: 24, background: color + "15", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>{icon}</span>
    <div>
      <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#475569", marginTop: 6, lineHeight: 1.5 }}>{text}</div>
      {action && <div style={{ fontSize: 12, color: color, fontWeight: 700, marginTop: 10 }}>→ {action}</div>}
    </div>
  </div>
);
