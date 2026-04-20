import React, { useState } from "react";
import { BRAND, ACCENT, RED } from "../utils";
import { useAppContext } from "../context/AppContext";
import { Menu, X, Activity, Zap, ShieldAlert, Cpu, BarChart3, TrendingUp, HelpCircle, Info, ChevronRight, Lock } from "lucide-react";

const PLAN_BADGES = {
  starter:    { label: "STARTER",    color: "#64748b", bg: "rgba(100,116,139,0.15)" },
  pro:        { label: "PRO",        color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  demo:       { label: "DEMO",       color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  enterprise: { label: "ENTERPRISE", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
};

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  stats, 
  onReset, 
  activePlan = 'starter', 
  isDemoMode, 
  usageStats,
  reportHistory = [],
  onLoadReport 
}) => {
  const { dataset } = useAppContext() || {};
  const isB2C = dataset?.type === 'b2c';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const isPro = activePlan === 'pro' || activePlan === 'enterprise';
  const isEnterprise = activePlan === 'enterprise';

  let badge = PLAN_BADGES[activePlan] || PLAN_BADGES.starter;
  if (isDemoMode) badge = PLAN_BADGES.demo;

  const styles = {
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

  const intelligenceItems = [
    { id: "fraud",    label: "Threat Intelligence",  icon: "🛡️", minPlan: "pro",        upgradeTo: "PRO" },
    { id: "forecast", label: "Predictions",   icon: "📈", minPlan: "pro",        upgradeTo: "PRO" },
    { id: "saas",     label: "Membership & SaaS Hub", icon: "💎", minPlan: "starter", upgradeTo: "PRO" }
  ];

  const planOrder = { starter: 0, pro: 1, enterprise: 2 };
  const canAccess = (minPlan) => (planOrder[activePlan] || 0) >= (planOrder[minPlan] || 0);

  const supportItems = [
    { id: "about",   label: "About Us",      icon: "🏢" },
    { id: "support", label: "Customer Help", icon: "🎧" },
  ];

  const handleNav = (id) => {
    setActiveTab(id);
    setMobileOpen(false); // close on mobile after tap
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, letterSpacing: "-0.03em" }}>
        SellerIQ <span style={{ color: "#60a5fa" }}>PRO</span>
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

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".csv"
        onChange={async (e) => {
          if (e.target.files && e.target.files[0]) {
            setIsUploading(true);
            try {
              if (onReset) {
                // We reuse onReset to signal a direct upload trigger to the parent
                await onReset(e.target.files[0]);
              }
            } finally {
              setIsUploading(false);
              e.target.value = ''; // Reset input
            }
          }
        }}
      />

      <button 
        onClick={() => {
          if (!isUploading) fileInputRef.current.click();
        }}
        disabled={isUploading}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: isUploading 
            ? 'linear-gradient(135deg, #94a3b8, #64748b)' 
            : 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: 'white',
          borderRadius: 12,
          border: 'none',
          fontSize: 13,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          cursor: isUploading ? 'not-allowed' : 'pointer',
          marginBottom: 8,
          boxShadow: isUploading ? 'none' : '0 8px 16px rgba(37, 99, 235, 0.2)',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={e => { if(!isUploading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(37, 99, 235, 0.3)'; } }}
        onMouseLeave={e => { if(!isUploading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(37, 99, 235, 0.2)'; } }}
      >
        {isUploading ? (
          <>
            <div className="sidebar-loader" style={{ 
              width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', 
              borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' 
            }} />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>⚡</span> Quick Upload
          </>
        )}
      </button>

      {/* 📊 QUOTA HUD */}
      {(() => {
        const PLAN_LIMITS = { starter: 999999, pro: 999999, enterprise: 999999 };
        const used = usageStats?.used || 0;
        const limit = usageStats?.limit || PLAN_LIMITS[activePlan.toLowerCase()] || 10;
        
        return (
          <div style={{ padding: '0 8px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Usage</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: used >= limit ? '#ef4444' : '#3b82f6' }}>
                {used} / {limit}
              </span>
            </div>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${Math.min(100, (used / limit) * 100)}%`, 
                background: used >= limit ? '#ef4444' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                borderRadius: 2,
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        );
      })()}

      <div style={{ flex: 1 }}>
        {/* ANALYTICS */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 16 }}>ANALYTICS</div>
        {analyticsItems.map(t => (
          <button key={t.id} onClick={() => handleNav(t.id)} style={styles.navItem(activeTab === t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}

        {/* INTELLIGENCE */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, margin: "32px 0 16px" }}>INTELLIGENCE</div>
        {intelligenceItems.map(t => (
          <React.Fragment key={t.id}>
            <button 
              onClick={() => handleNav(t.id)} 
              style={styles.navItem(activeTab === t.id)}
            >
              <span>{t.icon}</span> 
              <span>{t.label}</span>
              {!canAccess(t.minPlan) && !isDemoMode && (
                <span style={styles.lockBadge(
                  t.upgradeTo === "ENTERPRISE" ? "#f59e0b" : "#a855f7",
                  t.upgradeTo === "ENTERPRISE" ? "rgba(245,158,11,0.15)" : "rgba(168,85,247,0.15)"
                )}>
                  🔒 {t.upgradeTo}
                </span>
              )}
              {t.id === "fraud" && (
                <span style={{ 
                  background: RED, color: "#fff", fontSize: 9, padding: "2px 6px", 
                  borderRadius: 10, marginLeft: "auto", fontWeight: 900, boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)" 
                }}>
                  82
                </span>
              )}
            </button>
            {t.id === "forecast" && isDemoMode && (
                <div style={{ padding: "0 18px 12px", marginTop: -4 }}>
                  <div style={{ 
                    fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)",
                    padding: "8px 12px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)",
                    lineHeight: 1.4
                  }}>
                    ✨ Limited Trial Access. Upgrade to **PRO** or **ENTERPRISE** for unlimited analytics.
                  </div>
                </div>
              )}
          </React.Fragment>
        ))}

        {/* SUPPORT */}
        <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, margin: "32px 0 16px" }}>SUPPORT</div>
        {supportItems.map(t => (
          <button key={t.id} onClick={() => handleNav(t.id)} style={styles.navItem(activeTab === t.id)}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}

        {/* 🕒 REPORT HISTORY */}
        {reportHistory.length > 0 && (
          <div style={{ margin: "32px 0 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={12} /> REPORT HISTORY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
              {reportHistory.map(report => (
                <button 
                  key={report.id} 
                  onClick={() => onLoadReport(report.id)}
                  style={{
                    ...styles.navItem(false),
                    padding: "10px 14px",
                    background: "rgba(255,255,255,0.03)",
                    fontSize: 12,
                    marginBottom: 4,
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={report.filename}
                >
                  <div style={{ fontWeight: 800, color: '#f8fafc', marginBottom: 2 }}>{report.filename}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{new Date(report.upload_date).toLocaleDateString()} • {report.record_count} items</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button onClick={onReset} style={{ ...styles.navItem(false), marginTop: "auto", background: "rgba(0,0,0,0.03)", color: "#ef4444" }}>
        ⬅ Secure Exit
      </button>
    </>
  );

  const sidebarBase = {
    background: "rgba(15, 23, 42, 0.9)",
    backdropFilter: "blur(24px)",
    position: "relative",
    color: "#f8fafc",
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "10px 0 60px rgba(0,0,0,0.4)",
    overflowY: "auto",
    borderRight: "1px solid rgba(255,255,255,0.1)",
  };

  const auroraStyle = {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    overflow: 'hidden',
    zIndex: -1,
    opacity: 0.6
  };

  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          .sidebar-desktop { display: flex !important; }
          .sidebar-mobile-toggle { display: none !important; }
          .sidebar-mobile-overlay { display: none !important; }
          .sidebar-mobile-drawer { display: none !important; }
        }
        @media (max-width: 768px) {
          .sidebar-desktop { display: none !important; }
          .sidebar-mobile-toggle { display: flex !important; }
        }
        .aurora-blob {
          position: absolute;
          width: 300px;
          height: 300px;
          border_radius: 50%;
          filter: blur(80px);
          animation: move 20s infinite alternate;
        }
        @keyframes move {
          from { transform: translate(-50%, -50%); }
          to { transform: translate(50%, 50%); }
        }
      `}</style>

      {/* Desktop sidebar — fixed, always visible */}
      <div className="sidebar-desktop" style={{
        ...sidebarBase,
        width: 280,
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        <div style={auroraStyle}>
          <div className="aurora-blob" style={{ background: 'rgba(99, 102, 241, 0.15)', top: '20%', left: '20%' }} />
          <div className="aurora-blob" style={{ background: 'rgba(168, 85, 247, 0.15)', top: '60%', left: '80%', animationDelay: '-5s' }} />
          <div className="aurora-blob" style={{ background: 'rgba(59, 130, 246, 0.1)', top: '90%', left: '40%', animationDelay: '-10s' }} />
        </div>
        {sidebarContent}
      </div>

      {/* Mobile: hamburger button */}
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        style={{
          display: "none", // overridden by media query
          position: "fixed", top: 16, left: 16, zIndex: 200,
          background: "#0f172a", border: "none", borderRadius: 12,
          padding: "10px 12px", cursor: "pointer", color: "#fff",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
        }}
      >
        <Menu size={22} />
      </button>

      {/* Mobile: dark overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 199, backdropFilter: "blur(3px)"
          }}
        />
      )}

      {/* Mobile: slide-in drawer */}
      <div
        style={{
          ...sidebarBase,
          position: "fixed", top: 0, left: 0, bottom: 0,
          width: 280, zIndex: 200,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "rgba(255,255,255,0.1)", border: "none",
            borderRadius: 8, padding: 8, cursor: "pointer", color: "#fff"
          }}
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
