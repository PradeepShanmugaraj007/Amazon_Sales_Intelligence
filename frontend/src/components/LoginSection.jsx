import React, { useState } from "react";
import { ShieldCheck, Lock, User, ArrowRight, BarChart2, TrendingUp, CheckCircle, CreditCard, Key, Briefcase, Phone, Mail, RotateCcw, AlertTriangle } from "lucide-react";

const loadRazorpay = () => new Promise((resolve) => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const SaaS_PLANS = [
  { id: 'starter', name: 'Starter', price: 2999, features: ['3 files allowed / month', 'Basic Analytics', 'Standard Reports', 'Email Support'] },
  { id: 'pro', name: 'Pro', price: 5999, recommended: true, features: ['10 files allowed / month', 'Advanced Fraud AI', 'Revenue Forecasting', '24/7 Priority Support'] },
  { id: 'enterprise', name: 'Enterprise', price: 14999, features: ['30 files allowed / month', 'SaaS Integration Hub', 'Custom Modeling', '24/7 Call Support'] }
];

const LoginSection = ({ onLogin, initialView = "plans" }) => {
  const [view, setView] = useState(initialView); 
  // views: plans | user_login | admin | prefill | payment_success | forgot_password | forgot_sent | expired

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Prefill form state
  const [prefillPlan, setPrefillPlan] = useState(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [prefillErr, setPrefillErr] = useState("");

  // Payment success state
  const [successData, setSuccessData] = useState(null);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");

  const resetForm = (newView) => {
    setView(newView);
    setUser("");
    setPass("");
    setErr("");
    setIsLoading(false);
    setMsg("");
    setPrefillErr("");
  };

  // ── Step 1: Choose plan → show prefill form ──────────────────────────────
  const handleSelectPlan = (plan) => {
    setPrefillPlan(plan);
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
    setPrefillErr("");
    setView("prefill");
  };

  // ── Step 2: Prefill submitted → open Razorpay ────────────────────────────
  const handlePrefillSubmit = async (e) => {
    e.preventDefault();
    if (!buyerPhone.match(/^[6-9]\d{9}$/)) {
      setPrefillErr("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setIsLoading(true);
    setPrefillErr("");

    const resolved = await loadRazorpay();
    if (!resolved) {
      setPrefillErr("Razorpay SDK failed to load. Check your network.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/payments/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: prefillPlan.price, currency: "INR" })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setPrefillErr("Checkout Init Failed: " + (data.detail || "Internal Server Error"));
        setIsLoading(false);
        return;
      }

      const options = {
        key: data.key_id,
        amount: prefillPlan.price * 100,
        currency: "INR",
        order_id: data.order_id,
        name: "SellerIQ Pro",
        description: `${prefillPlan.name} Plan Subscription`,
        prefill: {
          name: buyerName,
          email: buyerEmail,
          contact: buyerPhone
        },
        theme: { color: "#3b82f6" },
        handler: async function (rzpResponse) {
          // Step 3: Call backend to create user & send email
          try {
            const completeRes = await fetch('http://localhost:5000/api/payments/complete-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_id: rzpResponse.razorpay_payment_id,
                plan: prefillPlan.id,
                name: buyerName,
                phone: buyerPhone,
                email: buyerEmail
              })
            });
            const completeData = await completeRes.json();
            setSuccessData({
              name: buyerName,
              email: buyerEmail,
              plan: prefillPlan.name,
              user_id: completeData.user_id,
              email_sent: completeData.email_sent
            });
            setView("payment_success");
          } catch {
            setView("payment_success");
            setSuccessData({ name: buyerName, email: buyerEmail, plan: prefillPlan.name, user_id: "—", email_sent: false });
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (e) {
      setPrefillErr("Network Error: Could not reach payment server.");
      setIsLoading(false);
    }
  };

  // ── Client Login (real validation) ───────────────────────────────────────
  const handleClientLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, password: pass })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.detail === "PLAN_EXPIRED") {
          setIsLoading(false);
          setSuccessData({
            name: data.name,
            email: data.email,
            plan: data.plan,
            expiry: data.expiry_date
          });
          setView("expired");
          return;
        }
        setErr(data.detail || "Login failed.");
        setIsLoading(false);
        return;
      }
      // Store the real signed JWT from backend
      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      localStorage.setItem("userEmail", data.user.email); 
      setMsg("Welcome back, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats), 800);
    } catch {
      setErr("Unable to reach the server. Make sure the backend is running.");
      setIsLoading(false);
    }
  };

  // ── Admin Login ───────────────────────────────────────────────────────────
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    setTimeout(() => {
      if (user === "admin@selleriq.pro" && pass === "password") {
        onLogin("admin");
      } else {

        setErr("Invalid internal database credentials. Access denied.");
        setIsLoading(false);
      }
    }, 800);
  };

  // ── Forgot Password ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.detail || "Error sending reset email.");
        setIsLoading(false);
        return;
      }
      setView("forgot_sent");
    } catch {
      setErr("Unable to reach server.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float { 0% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } 100% { transform: translateY(0px) scale(1); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
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

        .input-group { position: relative; margin-bottom: 20px; }
        .input-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: rgba(255, 255, 255, 0.4); transition: color 0.3s ease; }
        .custom-input {
          width: 100%; padding: 16px 20px 16px 54px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03); color: #fff; font-size: 15px; outline: none; transition: all 0.3s ease; box-sizing: border-box;
        }
        .custom-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .custom-input:focus { border-color: #3b82f6; background: rgba(255, 255, 255, 0.08); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

        .auth-btn {
          width: 100%; padding: 18px; border-radius: 16px; border: none; background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 12px; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.3); margin-top: 8px;
        }
        .auth-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(37, 99, 235, 0.4); }
        .auth-btn:disabled { opacity: 0.7; cursor: wait; background: linear-gradient(135deg, #475569, #334155); box-shadow: none; }
        .admin-btn { background: linear-gradient(135deg, #0f172a, #020617); border: 1px solid rgba(255,255,255,0.1); }

        .feature-item { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; color: rgba(255, 255, 255, 0.8); transition: transform 0.3s ease; }
        .feature-item:hover { transform: translateX(8px); }
        .feature-icon-wrapper { width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); display: flex; align-items: center; justify-content: center; color: #60a5fa; border: 1px solid rgba(255, 255, 255, 0.1); }
        .brand-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 20px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 24px; }

        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; animation: slideIn 0.4s ease-out; }
        .plan-card {
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px 24px;
          display: flex; flex-direction: column; transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .plan-card:hover { transform: translateY(-8px); background: rgba(255, 255, 255, 0.06); border-color: rgba(59, 130, 246, 0.4); }
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
          font-family: 'Inter', sans-serif; font-size: 14px; letter-spacing: 0.01em;
        }
        .btn-filled { background: #3b82f6; color: #fff; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; }
        .btn-filled:hover { background: #2563eb; }
        .btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; }
        .btn-outline:hover { background: rgba(255,255,255,0.05); }

        .text-btn {
          background: transparent; border: none; color: #60a5fa; cursor: pointer; font-size: 14px; font-weight: 600; transition: color 0.2s; padding: 8px; display: inline-flex; align-items: center; gap: 6px;
        }
        .text-btn:hover { color: #93c5fd; text-decoration: underline; }
        .footer-nav { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; flex-wrap: wrap; }

        .err-box { color: #fca5a5; font-size: 13px; font-weight: 600; margin-bottom: 20px; text-align: center; background: rgba(239, 68, 68, 0.15); padding: 12px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3); animation: fadeIn 0.3s ease; }
        .success-badge { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); border-radius: 12px; padding: 12px 20px; display: flex; align-items: center; gap: 10px; color: #34d399; font-weight: 700; font-size: 14px; margin-bottom: 20px; }

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
          {/* LEFT: Branding panel */}
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

          {/* RIGHT: Dynamic view */}
          <div className={`auth-right ${view === "plans" ? 'plans-view' : ''}`}>

            {/* ── PLANS ── */}
            {view === "plans" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
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
                      <button onClick={() => handleSelectPlan(plan)} className={`subscribe-btn ${plan.recommended ? 'btn-filled' : 'btn-outline'}`}>
                        Subscribe — ₹{plan.price.toLocaleString('en-IN')}/mo <CreditCard size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('http://localhost:5000/api/auth/bypass-login', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ plan: plan.id })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              sessionStorage.setItem("siq_auth_token", data.access_token);
                              sessionStorage.setItem("siq_user_name", data.user.name);
                              localStorage.setItem("userEmail", data.user.email); 
                              onLogin("user", data.user.plan, data.user.usageStats);
                            } else {
                              alert("Bypass Init Failed: " + (data.detail || "Internal Error"));
                            }
                          } catch (e) {
                            alert("Bypass Network Error: check if backend is running.");
                          }
                        }}
                        style={{
                          marginTop: 10, width: '100%', background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)',
                          fontSize: 11, padding: '8px', borderRadius: 8, cursor: 'pointer',
                          fontWeight: 700, letterSpacing: '0.03em'
                        }}
                      >
                        ⚡ Bypass — Testing Mode
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

            {/* ── PREFILL FORM ── */}
            {view === "prefill" && prefillPlan && (
              <div style={{ animation: "slideIn 0.3s ease-out" }}>
                <button onClick={() => resetForm("plans")} className="text-btn" style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
                  <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Plans
                </button>
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <div style={{ display: 'inline-block', padding: '6px 20px', background: 'rgba(59,130,246,0.2)', borderRadius: 100, color: '#93c5fd', fontSize: 13, fontWeight: 800, marginBottom: 16, border: '1px solid rgba(59,130,246,0.4)' }}>
                    {prefillPlan.name.toUpperCase()} PLAN · ₹{prefillPlan.price.toLocaleString('en-IN')}/mo
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>Complete Your Details</h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>We'll send your login credentials to your email after payment.</p>
                </div>
                <form onSubmit={handlePrefillSubmit}>
                  <div className="input-group">
                    <User size={20} className="input-icon" />
                    <input type="text" className="custom-input" placeholder="Full Name" value={buyerName} onChange={e => setBuyerName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Phone size={20} className="input-icon" />
                    <input type="tel" className="custom-input" placeholder="Mobile Number (10 digits)" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Mail size={20} className="input-icon" />
                    <input type="email" className="custom-input" placeholder="Gmail Address" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required />
                  </div>
                  {prefillErr && <div className="err-box">{prefillErr}</div>}
                  <button type="submit" className="auth-btn" disabled={isLoading}>
                    {isLoading ? "Opening Checkout..." : `Proceed to Pay ₹${prefillPlan.price.toLocaleString('en-IN')}`}
                    {!isLoading && <CreditCard size={20} />}
                  </button>
                </form>
              </div>
            )}

            {/* ── PAYMENT SUCCESS ── */}
            {view === "payment_success" && successData && (
              <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
                <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Payment Successful!</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginBottom: 32 }}>
                  Your <strong style={{ color: "#60a5fa" }}>{successData.plan}</strong> plan is now active.
                </p>
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 28, border: "1px solid rgba(255,255,255,0.1)", marginBottom: 28, textAlign: "left" }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>User ID Assigned</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#60a5fa", fontFamily: "monospace" }}>{successData.user_id}</div>
                  </div>
                  <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <Mail size={18} color="#34d399" />
                    <div style={{ fontSize: 13, color: "#34d399", fontWeight: 700 }}>
                      {successData.email_sent
                        ? `Credentials sent to ${successData.email}`
                        : `Check ${successData.email} shortly for your password.`
                      }
                    </div>
                  </div>
                </div>
                <button className="auth-btn" onClick={() => resetForm("user_login")}>
                  Go to Login <ArrowRight size={20} />
                </button>
              </div>
            )}

            {/* ── USER LOGIN ── */}
            {view === "user_login" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 48, animation: "slideIn 0.3s ease-out" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.05))", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <Briefcase size={32} color="#60a5fa" />
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 10px" }}>Client Login</h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 15, margin: 0 }}>Access your workspace dashboard.</p>
                </div>
                <form onSubmit={handleClientLogin}>
                  <div className="input-group">
                    <Mail size={22} className="input-icon" />
                    <input type="email" className="custom-input" placeholder="Registered Email" value={user} onChange={e => setUser(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Lock size={22} className="input-icon" />
                    <input type="password" className="custom-input" placeholder="Your Password" value={pass} onChange={e => setPass(e.target.value)} required />
                  </div>
                  {err && <div className="err-box">{err}</div>}
                  {msg && <div className="success-badge"><CheckCircle size={18} />{msg}</div>}
                  <button type="submit" className="auth-btn" disabled={isLoading}>
                    {isLoading ? "Authenticating..." : "Login to Dashboard"}
                    {!isLoading && <ArrowRight size={20} />}
                  </button>
                </form>
                <div className="footer-nav">
                  <button className="text-btn" onClick={() => resetForm("plans")} style={{ color: "rgba(255,255,255,0.7)" }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Plans
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
                  <button className="text-btn" onClick={() => { setForgotEmail(""); setErr(""); setView("forgot_password"); }} style={{ color: "#f59e0b" }}>
                    <RotateCcw size={14} /> Forgot Password
                  </button>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>|</span>
                  <button className="text-btn" onClick={() => resetForm("admin")} style={{ color: "#94a3b8" }}>
                    <Key size={14} /> Admin Access
                  </button>
                </div>
              </>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {view === "forgot_password" && (
              <div style={{ animation: "slideIn 0.3s ease-out" }}>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <RotateCcw size={32} color="#fbbf24" />
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>Reset Password</h2>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>Enter your registered email. We'll send a new password instantly.</p>
                </div>
                <form onSubmit={handleForgotPassword}>
                  <div className="input-group">
                    <Mail size={20} className="input-icon" />
                    <input type="email" className="custom-input" placeholder="Your registered email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                  </div>
                  {err && <div className="err-box">{err}</div>}
                  <button type="submit" className="auth-btn" disabled={isLoading}>
                    {isLoading ? "Sending Reset Email..." : "Send Reset Password"}
                    {!isLoading && <Mail size={20} />}
                  </button>
                </form>
                <div className="footer-nav">
                  <button className="text-btn" onClick={() => resetForm("user_login")} style={{ color: "rgba(255,255,255,0.7)" }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Login
                  </button>
                </div>
              </div>
            )}

            {/* ── FORGOT SENT ── */}
            {view === "forgot_sent" && (
              <div style={{ textAlign: "center", animation: "fadeIn 0.4s ease-out" }}>
                <div style={{ fontSize: 60, marginBottom: 20 }}>📩</div>
                <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, marginBottom: 12 }}>Check Your Email</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
                  A new temporary password has been sent to <strong style={{ color: "#60a5fa" }}>{forgotEmail}</strong>.<br />Use it to log in, then set a new password via the support page.
                </p>
                <button className="auth-btn" onClick={() => resetForm("user_login")}>
                  <ArrowRight size={20} style={{ transform: "rotate(180deg)" }} /> Back to Login
                </button>
              </div>
            )}

            {/* ── EXPIRED BLOCK ── */}
            {view === "expired" && successData && (
              <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
                <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', width: 'fit-content', margin: '0 auto 24px' }}>
                  <AlertTriangle size={48} color="#ef4444" />
                </div>
                <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 900, marginBottom: 8 }}>Subscription Expired</h2>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
                  Your <strong style={{ color: "#ef4444" }}>{successData.plan.toUpperCase()}</strong> membership for <strong>{successData.email}</strong> has already expired on <strong>{successData.expiry}</strong>.
                </p>
                
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)", marginBottom: 28, textAlign: "left" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Available Actions:</div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, paddingLeft: 20, margin: 0 }}>
                    <li style={{ marginBottom: 8 }}>Renew your current plan to restore access immediately.</li>
                    <li style={{ marginBottom: 8 }}>Upgrade to a higher tier for more features.</li>
                    <li>Download invoices from the support center.</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button className="auth-btn" onClick={() => {
                    setBuyerEmail(successData.email);
                    setBuyerName(successData.name);
                    setView("plans");
                  }}>
                    Renew or Upgrade Now <CreditCard size={20} />
                  </button>
                  <button className="text-btn" onClick={() => resetForm("user_login")} style={{ width: '100%', justifyContent: 'center' }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Clinical Login
                  </button>
                </div>
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {view === "admin" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 48, animation: "slideIn 0.3s ease-out" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                    <ShieldCheck size={32} color="#f8fafc" />
                  </div>
                  <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 10px", textTransform: "uppercase" }}>Global Admin</h2>
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
                  {err && <div className="err-box">{err}</div>}
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
