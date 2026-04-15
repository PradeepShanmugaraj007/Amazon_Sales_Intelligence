import React, { useState } from "react";
import { ShieldCheck, Lock, User, ArrowRight, BarChart2, TrendingUp, CheckCircle, CreditCard, Key, Briefcase } from "lucide-react";

const RED = "#ef4444";

const loadRazorpay = () => new Promise((resolve) => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const SaaS_PLANS = [
  { id: 'starter', name: 'Starter', price: 2999, features: ['3 files allowed / month', 'Basic Analytics', 'Standard Reports', 'Email Support'] },
  { id: 'pro', name: 'Pro', price: 5999, recommended: true, features: ['9 files allowed / month', 'Advanced Fraud AI', 'Revenue Forecasting', '24/7 Priority Support'] },
  { id: 'enterprise', name: 'Enterprise', price: 14999, features: ['30 files allowed / month', 'SaaS Integration Hub', 'Custom Modeling', '24/7 Call Support'] }
];

const LoginSection = ({ onLogin }) => {
  const [view, setView] = useState("plans"); // "plans" | "user_login" | "admin"
  
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [targetPlan, setTargetPlan] = useState('starter');

  const resetForm = (newView) => {
    setView(newView);
    setUser("");
    setPass("");
    setErr("");
    setIsLoading(false);
    setMsg("");
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    
    setTimeout(() => {
      if (user === "admin" && pass === "password123") {
        onLogin("admin"); // Enter Admin Panel directly
      } else {
        setErr("Invalid internal database credentials. Access denied.");
        setIsLoading(false);
      }
    }, 800);
  };

  const handleClientLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    
    setTimeout(() => {
      // UNIVERSAL BYPASS: Allow any correctly formatted email to act as a demo login
      if (user.includes("@") && pass.length >= 4) {
        setMsg("Authenticating...");
        setTimeout(() => {
           setMsg("Securing Session...");
           const mockToken = "siq_tk_" + Math.random().toString(36).substr(2, 9);
           sessionStorage.setItem("siq_auth_token", mockToken);
           setTimeout(() => {
              onLogin("user", targetPlan || 'starter');
           }, 800);
        }, 800);
      } else {
        setErr("Please enter a strictly valid Workspace Email and Passkey.");
        setIsLoading(false);
      }
    }, 400);
  };

  const handlePayment = async (plan) => {
    setSelectedPlan(plan.id);
    const resolved = await loadRazorpay();
    if (!resolved) {
      alert("Razorpay SDK failed to load. Please check your network connection.");
      setSelectedPlan(null);
      return;
    }

    const options = {
      // NOTE: Replace this with your actual Razorpay Test or Live Key ID
      key: "rzp_test_YOUR_KEY_HERE", 
      amount: plan.price * 100, // Amount in smallest currency unit (paise)
      currency: "INR",
      name: "SellerIQ Pro",
      description: `${plan.name} Plan Subscription`,
      handler: function (response) {
        // Successful payment callback
        console.log("Payment ID:", response.razorpay_payment_id);
        onLogin("user", plan.id); // Authorize entry into the Dashboard with the specific plan
      },
      prefill: {
        name: "Enterprise User",
        email: "user@selleriq.com"
      },
      theme: {
        color: "#3b82f6"
      },
      modal: {
        ondismiss: function() {
          setSelectedPlan(null);
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <>
      <style>{`
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } 100% { transform: translateY(0px) scale(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        
        .login-bg {
          min-height: 100vh; display: flex; background: linear-gradient(-45deg, #020617, #0f172a, #1e1b4b, #020617);
          background-size: 400% 400%; animation: gradientMove 15s ease infinite; font-family: 'Inter', sans-serif;
          position: relative; overflow: hidden; padding: 20px;
        }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.4; animation: float 12s ease-in-out infinite; pointer-events: none; }
        .orb-1 { width: 500px; height: 500px; background: #3b82f6; top: -150px; left: -100px; animation-delay: 0s; }
        .orb-2 { width: 450px; height: 450px; background: #8b5cf6; bottom: -100px; right: 5%; animation-delay: -3s; }
        .orb-3 { width: 400px; height: 400px; background: #0ea5e9; top: 30%; left: 35%; animation-delay: -6s; opacity: 0.3; }

        .auth-container {
          display: flex; width: 100%; max-width: 1100px; margin: auto; background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px; box-shadow: 0 40px 80px -20px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(255,255,255,0.05);
          overflow: hidden; z-index: 10; transition: max-width 0.5s ease;
        }
        .auth-container.expanded { max-width: 1300px; }

        .auth-left { flex: 1.3; padding: 80px 60px; display: flex; flex-direction: column; justify-content: center; position: relative; }
        .auth-right { flex: 1; min-width: 440px; background: rgba(0, 0, 0, 0.3); padding: 80px 60px; display: flex; flex-direction: column; justify-content: center; border-left: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); }
        .auth-right.plans-view { flex: 2; padding: 60px 40px; min-width: auto; }

        .input-group { position: relative; margin-bottom: 24px; }
        .input-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.4); transition: color 0.3s ease; }
        .custom-input {
          width: 100%; padding: 18px 20px 18px 54px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03); color: #fff; font-size: 15px; outline: none; transition: all 0.3s ease; box-sizing: border-box; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        .custom-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .custom-input:focus { border-color: #3b82f6; background: rgba(255, 255, 255, 0.08); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), inset 0 2px 4px rgba(0,0,0,0.1); }
        .custom-input:focus + .input-icon { color: #3b82f6; }

        .auth-btn {
          width: 100%; padding: 18px; border-radius: 16px; border: none; background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3); margin-top: 8px;
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(37, 99, 235, 0.4); background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .auth-btn:active:not(:disabled) { transform: translateY(0px); box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3); }
        .auth-btn:disabled { opacity: 0.7; cursor: wait; background: linear-gradient(135deg, #475569, #334155); box-shadow: none; }
        
        .admin-btn { background: linear-gradient(135deg, #0f172a, #020617); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 8px 15px rgba(0,0,0,0.5); }
        .admin-btn:hover:not(:disabled) { background: #1e293b; box-shadow: 0 12px 20px rgba(0,0,0,0.6); border-color: rgba(255,255,255,0.2); }

        .feature-item { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; color: rgba(255, 255, 255, 0.8); transition: transform 0.3s ease; }
        .feature-item:hover { transform: translateX(8px); }
        .feature-icon-wrapper { width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; color: #60a5fa; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        
        .brand-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 20px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 24px; }

        /* Plan Cards */
        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; animation: slideIn 0.4s ease-out; }
        .plan-card {
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px 24px;
          display: flex; flex-direction: column; transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .plan-card:hover { transform: translateY(-8px); background: rgba(255, 255, 255, 0.06); border-color: rgba(59, 130, 246, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .plan-card.recommended { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .plan-card.recommended::before {
          content: 'MOST POPULAR'; position: absolute; top: 0; left: 0; right: 0; background: linear-gradient(90deg, #2563eb, #3b82f6);
          color: #fff; font-size: 11px; font-weight: 800; text-align: center; padding: 6px 0; letter-spacing: 0.1em;
        }
        .plan-price { font-size: 40px; font-weight: 900; color: #fff; margin: 16px 0; }
        .plan-features { flex: 1; margin: 24px 0; display: flex; flex-direction: column; gap: 12px; }
        .plan-feat-item { display: flex; align-items: flex-start; gap: 12px; color: rgba(255, 255, 255, 0.7); font-size: 14px; }
        .subscribe-btn {
          width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; }
        .btn-outline:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.4); }
        .btn-primary { background: #3b82f6; color: #fff; }
        .btn-primary:hover { background: #2563eb; }

        .text-btn {
          background: transparent; border: none; color: #60a5fa; cursor: pointer; font-size: 14px; font-weight: 600; transition: color 0.2s; padding: 8px; display: inline-flex; align-items: center; gap: 6px;
        }
        .text-btn:hover { color: #93c5fd; text-decoration: underline; }
        
        .footer-nav {
          display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); paddingTop: 24px;
        }

        @media (max-width: 960px) {
          .auth-container { flex-direction: column; max-width: 500px; border-radius: 24px; }
          .auth-container.expanded { max-width: 500px; }
          .auth-left { display: none; }
          .auth-right { padding: 40px; min-width: auto; }
          .plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className={`auth-container ${view === "plans" ? 'expanded' : ''}`}>
          <div className="auth-left">
            <div className="brand-badge">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 10px #60a5fa" }}></span>
              SELLERIQ ENTERPRISE
            </div>
            
            <h1 style={{ color: "#fff", fontSize: 52, fontWeight: 900, marginBottom: 20, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              SellerIQ<span style={{ color: "#60a5fa" }}>Pro</span>
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 18, marginBottom: 56, maxWidth: 420, lineHeight: 1.6, fontWeight: 400 }}>
              The definitive intelligence platform giving e-commerce brands absolute clarity over their sales, risk, and growth.
            </p>

            <div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><BarChart2 size={26} color="#60a5fa" /></div>
                <div><div style={{ fontWeight: 800, color: "#fff", fontSize: 16, marginBottom: 4 }}>Real-time Intelligence</div><div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Deep insights into overall sales performance.</div></div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><ShieldCheck size={26} color="#fbbf24" /></div>
                <div><div style={{ fontWeight: 800, color: "#fff", fontSize: 16, marginBottom: 4 }}>Predictive Fraud Defense</div><div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Identify high-risk return offenders instantly.</div></div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><TrendingUp size={26} color="#34d399" /></div>
                <div><div style={{ fontWeight: 800, color: "#fff", fontSize: 16, marginBottom: 4 }}>Algorithmic Forecasting</div><div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Data-driven revenue and trajectory models.</div></div>
              </div>
            </div>
          </div>

          <div className={`auth-right ${view === "plans" ? 'plans-view' : ''}`}>
             
            {/* VIEW: SAAS PLANS */}
            {view === "plans" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 40, animation: "slideIn 0.3s ease-out" }}>
                  <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 10px" }}>Select a SaaS Plan</h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 15, margin: 0 }}>Initialize your workspace by activating your subscription.</p>
                </div>

                <div className="plans-grid">
                  {SaaS_PLANS.map(plan => (
                    <div key={plan.id} className={`plan-card ${plan.recommended ? 'recommended' : ''}`}>
                      <h3 style={{ color: '#fff', margin: plan.recommended ? '12px 0 0' : '0', fontSize: 20 }}>{plan.name}</h3>
                      <div className="plan-price">
                        <span style={{ fontSize: 20, verticalAlign: 'top', color: 'rgba(255,255,255,0.5)' }}>₹</span>
                        {plan.price.toLocaleString('en-IN')}
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}> / mo</span>
                      </div>
                      
                      <div className="plan-features">
                        {plan.features.map((f, i) => (
                          <div key={i} className="plan-feat-item">
                            <CheckCircle size={18} color={plan.recommended ? "#3b82f6" : "#4ade80"} style={{ flexShrink: 0 }} />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => handlePayment(plan)}
                        className={`subscribe-btn ${plan.recommended ? 'btn-primary' : 'btn-outline'}`}
                        disabled={selectedPlan === plan.id}
                        style={{ marginBottom: 12 }}
                      >
                        {selectedPlan === plan.id ? "Connecting..." : "Activate Now"}
                        {!selectedPlan && <CreditCard size={18} />}
                      </button>

                      <button 
                        onClick={() => onLogin("user", plan.id)}
                        style={{ 
                          background: "none", border: "1px solid rgba(255,255,255,0.1)", 
                          color: "rgba(255,255,255,0.4)", fontSize: 11, padding: "8px", 
                          borderRadius: 8, cursor: "pointer", fontWeight: 700 
                        }}
                      >
                        Bypass to Demo Access
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="footer-nav">
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Already have an account?</span>
                  <button className="text-btn" onClick={() => resetForm("user_login")}>
                    Workspace Login <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}


            {/* VIEW: USER / CLIENT LOGIN */}
            {view === "user_login" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 48, animation: "slideIn 0.3s ease-out" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.05))", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" }}>
                    <Briefcase size={32} color="#60a5fa" />
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.01em" }}>Client Login</h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 15, margin: 0 }}>Access your designated workspace dashboard.</p>
                </div>

                <form onSubmit={handleClientLogin}>
                  <div className="input-group">
                    <User size={22} className="input-icon" />
                    <input type="email" className="custom-input" placeholder="Work Email Address" value={user} onChange={e => setUser(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ marginBottom: 24 }}>
                    <Lock size={22} className="input-icon" />
                    <input type="password" className="custom-input" placeholder="Workspace Passkey" value={pass} onChange={e => setPass(e.target.value)} required />
                  </div>

                  <div className="input-group" style={{ marginBottom: 32 }}>
                    <label style={{ display: "block", color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 800, marginBottom: 8, letterSpacing: 1 }}>SELECT TESTING DOMAIN</label>
                    <select 
                      className="custom-input" 
                      style={{ paddingLeft: 20, appearance: "none" }}
                      value={targetPlan}
                      onChange={e => setTargetPlan(e.target.value)}
                    >
                      <option value="starter" style={{ background: "#0f172a" }}>Starter Workspace (Basic)</option>
                      <option value="pro" style={{ background: "#0f172a" }}>Pro Domain (Risk + Fraud)</option>
                      <option value="enterprise" style={{ background: "#0f172a" }}>Enterprise Node (Full SaaS Hub)</option>
                    </select>
                  </div>

                  {err && (<div style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600, marginBottom: 24, textAlign: "center", background: "rgba(239, 68, 68, 0.15)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", animation: "fadeIn 0.3s ease" }}>{err}</div>)}

                  <button type="submit" className="auth-btn" disabled={isLoading}>
                    {isLoading ? (msg || "Authenticating...") : "Login to Domain"}
                    {!isLoading && <ArrowRight size={20} />}
                  </button>
                </form>

                <div className="footer-nav" style={{ flexWrap: 'wrap' }}>
                  <button className="text-btn" onClick={() => resetForm("plans")} style={{ color: "rgba(255,255,255,0.7)" }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Features
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
                  <button className="text-btn" onClick={() => resetForm("admin")} style={{ color: "#94a3b8" }}>
                    <Key size={14} /> Admin Access
                  </button>
                </div>
              </>
            )}

            {/* VIEW: ADMIN GATEWAY */}
            {view === "admin" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 48, animation: "slideIn 0.3s ease-out" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" }}>
                    <ShieldCheck size={32} color="#f8fafc" />
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-0.01em", textTransform: "uppercase" }}>Global Admin</h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 15, margin: 0 }}>Restricted access gateway.</p>
                </div>

                <form onSubmit={handleAdminLogin}>
                  <div className="input-group">
                    <User size={22} className="input-icon" />
                    <input type="text" className="custom-input" placeholder="Admin Identity" value={user} onChange={e => setUser(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ marginBottom: 32 }}>
                    <Lock size={22} className="input-icon" />
                    <input type="password" className="custom-input" placeholder="Secure Password" value={pass} onChange={e => setPass(e.target.value)} required />
                  </div>

                  {err && (<div style={{ color: "#fca5a5", fontSize: 13, fontWeight: 600, marginBottom: 24, textAlign: "center", background: "rgba(239, 68, 68, 0.15)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", animation: "fadeIn 0.3s ease" }}>{err}</div>)}

                  <button type="submit" className="auth-btn admin-btn" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Establish Root Connection"}
                  </button>
                </form>

                <div className="footer-nav">
                  <button className="text-btn" onClick={() => resetForm("user_login")} style={{ color: "rgba(255,255,255,0.7)" }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Return to Client Login
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default LoginSection;
