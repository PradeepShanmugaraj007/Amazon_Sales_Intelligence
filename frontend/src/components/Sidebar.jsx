import React from "react";
import { BRAND, ACCENT, RED } from "../utils";
import { useAppContext } from "../context/AppContext";

const Sidebar = ({ activeTab, setActiveTab, stats, onReset }) => {
  const { dataset } = useAppContext() || {};
  const isB2C = dataset?.type === 'b2c';

  const styles = {
    sidebar: { width: 280, background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)", color: "#f8fafc", padding: "32px 24px", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, boxShadow: "10px 0 40px rgba(0,0,0,0.1)" },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12, border: "none", cursor: "pointer",
      background: active ? "rgba(255, 255, 255, 0.15)" : "transparent", color: active ? "#ffffff" : "rgba(255, 255, 255, 0.6)", width: "100%", textAlign: "left",
      fontWeight: active ? 800 : 600, transition: "all 0.2s", marginBottom: 8, fontSize: 14
    }),
  };

  return (
    <div style={styles.sidebar}>
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 48, letterSpacing: "-0.03em" }}>SellerIQ <span style={{ color: BRAND }}>PRO</span></div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 16 }}>ANALYTICS</div>
        {[
          { id: "overview", label: "Dashboard", icon: "📊" },
          { id: "sku", label: "Product Analysis", icon: "🏷️" },
          { id: "regions", label: "Regions", icon: "🗺️" },
          { id: "tax", label: isB2C ? "Sales Health" : "Financials", icon: isB2C ? "💖" : "🧾" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={styles.navItem(activeTab === t.id)}><span>{t.icon}</span> {t.label}</button>
        ))}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, margin: "32px 0 16px" }}>INTELLIGENCE</div>
        {[
          { id: "fraud", label: "Risk & Fraud", icon: "🛡️" },
          { id: "forecast", label: "Predictions", icon: "📈" },
          { id: "saas", label: "SaaS Hub", icon: "💎" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={styles.navItem(activeTab === t.id)}>
            <span>{t.icon}</span> {t.label}
            {t.id === "fraud" && (stats?.fraud?.totalAlerts > 0) && (
              <span style={{ background: RED, color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 10, marginLeft: "auto", fontWeight: 900 }}>
                {stats.fraud.totalAlerts}
              </span>
            )}
          </button>
        ))}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, margin: "32px 0 16px" }}>SUPPORT</div>
        {[
          { id: "about", label: "About Us", icon: "🏢" },
          { id: "support", label: "Customer Help", icon: "🎧" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={styles.navItem(activeTab === t.id)}><span>{t.icon}</span> {t.label}</button>
        ))}
      </div>
      <button onClick={onReset} style={{ ...styles.navItem(false), marginTop: "auto", background: "rgba(0,0,0,0.03)", color: "#ef4444" }}>⬅ Secure Exit</button>
    </div>
  );
};

export default Sidebar;
