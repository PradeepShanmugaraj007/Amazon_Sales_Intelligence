import React, { useState } from "react";

const CATEGORIES = ["all", "revenue", "returns", "fraud", "sku", "geo", "logistics", "tax", "growth"];

const CAT_LABELS = {
  all: "All Insights",
  revenue: "Revenue",
  returns: "Returns",
  fraud: "Risk & Fraud",
  sku: "SKU",
  geo: "Geography",
  logistics: "Logistics",
  tax: "Tax",
  growth: "Growth",
};

const SEVERITY_CONFIG = {
  critical: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", badge: "#ef4444", label: "CRITICAL", dot: "#ef4444" },
  warning:  { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", badge: "#f59e0b", label: "WARNING",  dot: "#f59e0b" },
  positive: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", badge: "#10b981", label: "POSITIVE", dot: "#10b981" },
  neutral:  { bg: "rgba(99,102,241,0.06)", border: "rgba(99,102,241,0.2)",  badge: "#818cf8", label: "INFO",     dot: "#818cf8" },
};

const CAT_COLORS = {
  revenue:   "#3b82f6",
  returns:   "#f59e0b",
  fraud:     "#ef4444",
  sku:       "#8b5cf6",
  geo:       "#06b6d4",
  logistics: "#10b981",
  tax:       "#f97316",
  growth:    "#22d3ee",
  neutral:   "#818cf8",
};

export default function InsightsPanel({ insights = [] }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState(null);

  if (!insights || insights.length === 0) return null;

  // Normalize: handle both old string format and new dict format
  const normalized = insights.map((item, i) => {
    if (typeof item === "string") {
      return { text: item, category: "revenue", severity: "neutral", icon: "💡", metric: null, _id: i };
    }
    return { ...item, _id: i };
  });

  const filtered = activeCategory === "all"
    ? normalized
    : normalized.filter((ins) => ins.category === activeCategory);

  const counts = {};
  CATEGORIES.forEach((c) => {
    counts[c] = c === "all" ? normalized.length : normalized.filter((i) => i.category === c).length;
  });

  const criticals = normalized.filter((i) => i.severity === "critical").length;
  const warnings  = normalized.filter((i) => i.severity === "warning").length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes insightSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .insight-card {
          border-radius: 14px;
          padding: 16px 20px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          animation: insightSlideIn 0.25s ease forwards;
        }
        .insight-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .cat-chip {
          padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
          cursor: pointer; transition: all 0.2s; white-space: nowrap; border: 1px solid transparent;
        }
        .insight-metric {
          font-size: 11px; font-weight: 800; padding: 3px 10px;
          border-radius: 20px; letter-spacing: 0.04em; white-space: nowrap;
        }
        .severity-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 2px;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🧠
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Intelligence Insights</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{normalized.length} AI-generated observations from your data</div>
            </div>
          </div>
        </div>
        {/* Summary badges */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {criticals > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, fontWeight: 700, color: "#ef4444" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
              {criticals} Critical
            </div>
          )}
          {warnings > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", fontSize: 12, fontWeight: 700, color: "#f59e0b" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
              {warnings} Warning
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", fontSize: 12, fontWeight: 700, color: "#818cf8" }}>
            ✦ {normalized.length} Total
          </div>
        </div>
      </div>

      {/* Category filter chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20, scrollbarWidth: "none" }}>
        {CATEGORIES.filter((c) => counts[c] > 0).map((cat) => {
          const isActive = activeCategory === cat;
          const color = cat === "all" ? "#6366f1" : CAT_COLORS[cat] || "#6366f1";
          return (
            <button
              key={cat}
              className="cat-chip"
              onClick={() => setActiveCategory(cat)}
              style={{
                background: isActive ? color + "18" : "rgba(241,245,249,0.8)",
                borderColor: isActive ? color + "50" : "transparent",
                color: isActive ? color : "#64748b",
              }}
            >
              {CAT_LABELS[cat]} <span style={{ opacity: 0.7, fontWeight: 600 }}>({counts[cat]})</span>
            </button>
          );
        })}
      </div>

      {/* Insight cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((ins, idx) => {
          const sev = SEVERITY_CONFIG[ins.severity] || SEVERITY_CONFIG.neutral;
          const catColor = CAT_COLORS[ins.category] || "#818cf8";
          const isOpen = expanded === ins._id;

          return (
            <div
              key={ins._id}
              className="insight-card"
              onClick={() => setExpanded(isOpen ? null : ins._id)}
              style={{
                background: sev.bg,
                border: `1px solid ${sev.border}`,
                opacity: 0,
                animationDelay: `${idx * 0.04}s`,
                animationFillMode: "forwards",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Icon */}
                <div style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{ins.icon || "💡"}</div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Severity dot */}
                      <div className="severity-dot" style={{ background: sev.dot }} />
                      {/* Category tag */}
                      <span style={{ fontSize: 10, fontWeight: 800, color: catColor, textTransform: "uppercase", letterSpacing: "0.08em", background: catColor + "14", padding: "2px 8px", borderRadius: 6 }}>
                        {CAT_LABELS[ins.category] || ins.category}
                      </span>
                      {/* Severity badge */}
                      <span className="insight-metric" style={{ background: sev.badge + "18", color: sev.badge, border: `1px solid ${sev.badge}30` }}>
                        {sev.label}
                      </span>
                    </div>
                    {/* Metric pill */}
                    {ins.metric && (
                      <span className="insight-metric" style={{ background: catColor + "14", color: catColor, border: `1px solid ${catColor}30`, flexShrink: 0 }}>
                        {ins.metric}
                      </span>
                    )}
                  </div>

                  {/* Text */}
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#1e293b", lineHeight: 1.6 }}>
                    {ins.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8", fontSize: 14 }}>
          No insights in this category for the current dataset.
        </div>
      )}
    </div>
  );
}
