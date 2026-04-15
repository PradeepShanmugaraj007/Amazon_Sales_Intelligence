import React from "react";
import { BRAND, ACCENT, RED } from "../utils";
import { useAppContext } from "../context/AppContext";

const PLAN_BADGES = {
  starter: { label: "STARTER", color: "#64748b", bg: "rgba(100,116,139,0.15)" },
  pro:     { label: "PRO",     color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  enterprise: { label: "ENTERPRISE", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
};

const Sidebar = ({ activeTab, setActiveTab, stats, onReset, activePlan = 'starter' }) => {
  const { dataset } = useAppContext() || {};
  const isB2C = dataset?.type === 'b2c';

  const isPro = activePlan === 'pro' || activePlan === 'enterprise';
  const isEnterprise = activePlan === 'enterprise';

  const badge = PLAN_BADGES[activePlan] || PLAN_BADGES.starter;

  const styles = {
    sidebar: {
      width: 280,
      background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)",
      color: "#f8fafc",
      padding: "32px 24px",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      boxShadow: "10px 0 40px rgba(0,0,0,0.1)",
      overflowY: "auto",
    },
    navItem: (active) => ({
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 18px", borderRadius: 12, border: "none", cursor: "pointer",
      background: active ? "rgba(255,255,255,0.15)" : "transparent",
      color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
      width: "100%", textAlign: "left",
      fontWeight: active ? 800 : 600,
      transition: "all 0.2s", marginBottom: 8, fontSize: 14,
    }),
    lockedItem: {
      display: "flex", alignItems: "center", gap: 12,
      padding: "14px 18px", borderRadius: 12,
      background: "rgba(0,0,0,0.15)",
      color: "rgba(255,255,255,0.25)",
      width: "100%", marginBottom: 8, fontSize: 14,
      fontWeight: 600, cursor: "not-allowed", userSelect: "none",
    },
    lockBadge: (color, bg) => ({
      marginLeft: "auto", fontSize: 9, fontWeight: 800,
      letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 8,
      color, background: bg, border: `1px solid ${color}40`,
    }),
  };

  const analyticsItems = [
    { id: "overview",  label: "Dashboard",       icon: "📊" },
    { id: "sku",       label: "Product Analysis", icon: "🏷️" },
    { id: "regions",   label: "Regions",          icon: "🗺️" },
    { id: "tax",       label: isB2C ? "Sales Health" : "Financials", icon: isB2C ? "💖" : "🧾" },
  ];

  // Intelligence items with minimum required plan
  const intelligenceItems = [
    { id: "fraud",    label: "Risk & Fraud",  icon: "🛡️", minPlan: "pro",        upgradeTo: "PRO" },
    { id: "forecast", label: "Predictions",   icon: "📈", minPlan: "pro",        upgradeTo: "PRO" },
    { id: "saas",     label: "SaaS Hub",      icon: "💎", minPlan: "enterprise", upgradeTo: "ENTERPRISE" },
  ];

  const planOrder = { starter: 0, pro: 1, enterprise: 2 };
  const canAccess = (minPlan) => (planOrder[activePlan] || 0) >= (planOrder[minPlan] || 0);

  const supportItems = [
    { id: "about",   label: "About Us",      icon: "🏢" },
    { id: "support", label: "Customer Help", icon: "🎧" },
  ];

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, letterSpacing: "-0.03em" }}>
        SellerIQ <span style={{ color: BRAND }}>PRO</span>
      </div>

      {/* Plan Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "5px 12px", borderRadius: 20, marginBottom: 36,
        background: badge.bg, border: `1px solid ${badge.color}40`,
        color: badge.color, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
        width: "fit-content",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: badge.color, boxShadow: `0 0 6px ${badge.color}` }} />
        {badge.label} PLAN
      </div>

      <div style={{ flex: 1 }}>
        {/* ANALYTICS */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 16 }}>ANALYTICS</div>
        {analyticsItems.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={styles.navItem(activeTab === t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}

        {/* INTELLIGENCE */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, margin: "32px 0 16px" }}>INTELLIGENCE</div>
        {intelligenceItems.map(t => {
          const accessible = canAccess(t.minPlan);
          if (accessible) {
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={styles.navItem(activeTab === t.id)}>
                <span>{t.icon}</span> {t.label}
                {t.id === "fraud" && (stats?.fraud?.totalAlerts > 0) && (
                  <span style={{ background: RED, color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 10, marginLeft: "auto", fontWeight: 900 }}>
                    {stats.fraud.totalAlerts}
                  </span>
                )}
              </button>
            );
          }
          return (
            <div key={t.id} style={styles.lockedItem} title={`Upgrade to ${t.upgradeTo} to unlock`}>
              <span style={{ opacity: 0.4 }}>{t.icon}</span>
              <span style={{ opacity: 0.4 }}>{t.label}</span>
              <span style={styles.lockBadge(
                t.upgradeTo === "ENTERPRISE" ? "#f59e0b" : "#a855f7",
                t.upgradeTo === "ENTERPRISE" ? "rgba(245,158,11,0.15)" : "rgba(168,85,247,0.15)"
              )}>
                🔒 {t.upgradeTo}
              </span>
            </div>
          );
        })}

        {/* SUPPORT */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, margin: "32px 0 16px" }}>SUPPORT</div>
        {supportItems.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={styles.navItem(activeTab === t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <button onClick={onReset} style={{ ...styles.navItem(false), marginTop: "auto", background: "rgba(0,0,0,0.03)", color: "#ef4444" }}>
        ⬅ Secure Exit
      </button>
    </div>
  );
};

export default Sidebar;
