import React from "react";
import { Check } from "lucide-react";
import { BRAND } from "../utils";

export const SaaS_PLANS = [
  { id: 'starter', name: 'Starter', price: 299, features: ['3 files per month', 'Up to 5,000 orders', 'Email Support', 'Basic Analytics'] },
  { id: 'pro', name: 'Pro', price: 649, recommended: true, features: ['10 files per month', 'Up to 25,000 orders', '24/7 Priority Support', 'AI Fraud Detection', 'Predictive Forecasting'] },
  { id: 'enterprise', name: 'Enterprise', price: 1499, features: ['30 files per month', 'Unlimited orders', '24/7 Call Support', 'Full API Access', 'Custom Integrations'] }
];

export const SaaSMembership = ({ styles, activePlan }) => {
  const isDemoMode = styles?.isDemoMode;
  return (
    <div className="dash-grid-3" style={{ marginTop: 40 }}>
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
                  window.location.hash = 'login';
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

export const UpgradeBanner = ({ feature, requiredPlan, color, icon, activePlan }) => {
  const planOrder = { starter: 0, pro: 1, enterprise: 2 };
  const currentLevel = planOrder[String(activePlan).toLowerCase()] || 0;
  const availablePlans = SaaS_PLANS.filter(p => planOrder[p.id] > currentLevel);

  return (
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
        You are currently using the <strong style={{ textTransform: 'capitalize' }}>{activePlan}</strong> plan. Upgrade to unlock this feature and get access to advanced analytics, forecasting, and intelligence tools.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${availablePlans.length}, 1fr)`, gap: 24, maxWidth: availablePlans.length === 1 ? 380 : 760, margin: '0 auto 32px', textAlign: 'left' }}>
        {availablePlans.map((p, i) => (
          <div key={i} style={{ 
            background: 'white', border: '1px solid #e2e8f0', 
            borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)'
          }}>
            {p.recommended && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: BRAND, color: 'white', fontSize: 10, fontWeight: 900, textAlign: 'center', padding: '4px 0', letterSpacing: 1 }}>RECOMMENDED</div>}
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
              onClick={() => { window.location.hash = 'login'; }}
              style={{ 
                width: '100%', padding: '12px', borderRadius: 12, border: 'none', 
                background: BRAND, color: 'white',
                fontWeight: 800, cursor: 'pointer'
              }}
            >
              Upgrade to {p.name}
            </button>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
        Contact us at support@selleriq.pro to upgrade your subscription.
      </div>
    </div>
  );
};
