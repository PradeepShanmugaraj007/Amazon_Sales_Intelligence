import React, { useState } from "react";
import { ShieldCheck, Lock, User, ArrowRight, BarChart2, TrendingUp, CheckCircle, CreditCard, Key, Briefcase, Phone, Mail, RotateCcw, AlertTriangle, MapPin, ChevronDown, Eye, EyeOff, Sparkles } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';
const loadRazorpay = () => new Promise((resolve) => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

const SaaS_PLANS = [
  { id: 'starter', name: 'Starter', prices: { 1: 299, 12: 3050, 24: 5382, 48: 8611 }, features: ['3 files per month', 'Up to 5,000 orders', 'Email Support', 'Basic Analytics'] },
  { id: 'pro', name: 'Pro', prices: { 1: 649, 12: 6620, 24: 11682, 48: 18691 }, recommended: true, features: ['10 files per month', 'Up to 25,000 orders', '24/7 Priority Support', 'AI Fraud Detection', 'Predictive Forecasting'] },
  { id: 'enterprise', name: 'Enterprise', prices: { 1: 1499, 12: 15290, 24: 26982, 48: 43171 }, features: ['30 files per month', 'Unlimited orders', '24/7 Call Support', 'Full API Access', 'Custom Integrations'] }
];

const LoginSection = ({ onLogin, initialView = "plans", prefillData = null }) => {
  // 'expired_redirect' means the dashboard pushed the user out due to plan expiry
  const resolvedInitialView = initialView === 'expired_redirect' ? 'user_login' : initialView;
  const [view, setView] = useState(resolvedInitialView);
  const [sessionExpiredMsg] = useState(initialView === 'expired_redirect');
  // views: plans | user_login | admin | prefill | payment_success | forgot_password | forgot_sent | expired

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [billingCycle, setBillingCycle] = useState(1);

  // Prefill form state
  const [prefillPlan, setPrefillPlan] = useState(null);
  const [buyerName, setBuyerName] = useState(prefillData?.name || "");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState(prefillData?.email || "");
  const [prefillErr, setPrefillErr] = useState("");

  // Payment success state
  const [successData, setSuccessData] = useState(null);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [regErr, setRegErr] = useState("");
  const [regMsg, setRegMsg] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const resetForm = (newView) => {
    setView(newView);
    setUser("");
    setPass("");
    setErr("");
    setIsLoading(false);
    setMsg("");
    setPrefillErr("");
    // Reset register state too
    setRegName(""); setRegEmail(""); setRegPhone(""); setRegOtp(""); setRegPass(""); setRegConfirmPass("");
    setRegErr(""); setRegMsg(""); setOtpSent(false);
  };

  React.useEffect(() => {
    if (prefillData) {
      if (prefillData.name) setBuyerName(prefillData.name);
      if (prefillData.email) setBuyerEmail(prefillData.email);
    }
  }, [prefillData]);

  // ── Step 1: Choose plan → show prefill form ──────────────────────────────
  const handleSelectPlan = (plan) => {
    setPrefillPlan(plan);
    setBuyerName(prefillData?.name || "");
    setBuyerPhone("");
    setBuyerEmail(prefillData?.email || "");
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

    const basePrice = prefillPlan.prices ? prefillPlan.prices[billingCycle] : prefillPlan.price;
    const gstAmount = Math.round(basePrice * 0.18);
    const totalAmount = basePrice + gstAmount;

    const resolved = await loadRazorpay();
    if (!resolved) {
      setPrefillErr("Razorpay SDK failed to load. Check your network.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/payments/create-payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, currency: "INR" })
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setPrefillErr("Checkout Init Failed: " + (data.detail || "Internal Server Error"));
        setIsLoading(false);
        return;
      }

      const options = {
        key: data.key_id,
        amount: totalAmount * 100,
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
            const completeRes = await fetch('/api/v1/payments/complete-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                payment_id: rzpResponse.razorpay_payment_id,
                plan: prefillPlan.id,
                name: buyerName,
                phone: buyerPhone,
                email: buyerEmail,
                billing_cycle: billingCycle
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

  // ── OTP & Register ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!regName.trim()) { setRegErr("Please enter your full name first."); return; }
    if (!regEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { setRegErr("Enter a valid email address."); return; }
    setRegErr("");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, name: regName }),
      });
      const data = await res.json();
      if (!res.ok) { setRegErr(data.detail || "Failed to send OTP."); setOtpLoading(false); return; }
      setOtpSent(true);
      setRegMsg("✅ OTP sent to " + regEmail + ". Check your inbox!");
      setOtpLoading(false);
    } catch { setRegErr("Could not reach server."); setOtpLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr("");
    if (!otpSent) { setRegErr("Please request your OTP first."); return; }
    if (regOtp.length !== 6) { setRegErr("Enter the 6-digit OTP from your email."); return; }
    if (regPass.length < 8) { setRegErr("Password must be at least 8 characters."); return; }
    if (regPass !== regConfirmPass) { setRegErr("Passwords do not match."); return; }
    setRegLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, phone: regPhone, otp: regOtp, password: regPass }),
      });
      const data = await res.json();
      if (!res.ok) { setRegErr(data.detail || "Registration failed."); setRegLoading(false); return; }
      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      sessionStorage.setItem("siq_plan_expiry", data.user.plan_expiry || "");
      sessionStorage.setItem("siq_plan_status", JSON.stringify(data.plan_status || {}));
      localStorage.setItem("userEmail", data.user.email);
      setRegMsg("🎉 Account created! Welcome, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats, data.plan_status, "demo"), 1000);
    } catch { setRegErr("Could not reach server."); setRegLoading(false); }
  };

  // ── Client Login (real validation) ───────────────────────────────────────
  const handleClientLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErr("");
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user, password: pass })
      });
      const data = await res.json();

      // ── Handle expired plan ──────────────────────────────────────────────
      if (res.status === 402 && data.detail === "PLAN_EXPIRED") {
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

      if (!res.ok) {
        setErr(data.detail || "Login failed.");
        setIsLoading(false);
        return;
      }

      // Store the real signed JWT from backend
      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      sessionStorage.setItem("siq_plan_expiry", data.user.plan_expiry || "");
      sessionStorage.setItem("siq_plan_status", JSON.stringify(data.plan_status || {}));
      localStorage.setItem("userEmail", data.user.email);
      setMsg("Welcome back, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats, data.plan_status), 800);
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
      const res = await fetch('/api/v1/auth/forgot-password', {
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

  const handleGoogleSuccess = async (credentialResponse) => {
    setIsLoading(true);
    setErr("");
    try {
      const res = await fetch('/api/v1/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();

      if (res.status === 402 && data.detail === "PLAN_EXPIRED") {
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

      if (!res.ok) {
        setErr(data.detail || "Google login failed.");
        setIsLoading(false);
        return;
      }

      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      if (data.user.picture) sessionStorage.setItem("siq_user_picture", data.user.picture);
      sessionStorage.setItem("siq_plan_expiry", data.user.plan_expiry || "");
      sessionStorage.setItem("siq_plan_status", JSON.stringify(data.plan_status || {}));
      localStorage.setItem("userEmail", data.user.email);
      setMsg("Welcome, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats, data.plan_status), 800);
    } catch (e) {
      setErr("Google authentication failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErr("Google Login was unsuccessful. Try again.");
  };

  const handleGooglePrefill = async (credentialResponse) => {
    try {
      const res = await fetch('/api/v1/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      
      if (data.user) {
        setBuyerName(data.user.name);
        setBuyerEmail(data.user.email);
        setMsg(`Details imported from Google for ${data.user.email}`);
        setTimeout(() => setMsg(""), 3000);
      }
    } catch (e) {
      setPrefillErr("Failed to fetch details from Google.");
    }
  };

  const GOOGLE_CLIENT_ID = "505753164861-3s7egj0sp4c2pg8t9r743dpqeq1jib70.apps.googleusercontent.com"; // Replace with your actual Client ID

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

        .auth-left { flex: 1.3; padding: 60px 60px 60px 60px; display: flex; flex-direction: column; justify-content: center; position: relative; }
        .auth-logo { display: flex; align-items: center; gap: 10px; position: absolute; top: 28px; left: 36px; }
        .auth-logo-icon { width: 34px; height: 34px; border-radius: 9px; object-fit: contain; flex-shrink: 0; }
        .auth-logo-wordmark { display: flex; flex-direction: column; line-height: 1; }
        .auth-logo-name { font-size: 1rem; font-weight: 800; letter-spacing: -0.4px; color: #fff; }
        .auth-logo-name span { color: #60a5fa; }
        .auth-logo-tagline { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .auth-right { flex: 1; min-width: 440px; background: rgba(0, 0, 0, 0.3); padding: 80px 60px; display: flex; flex-direction: column; justify-content: center; border-left: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); }
        .auth-right.expanded-view { flex: 2; padding: 60px 40px; min-width: auto; }

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

        .plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; animation: slideIn 0.4s ease-out; }
        .plan-card {
          background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 28px 20px;
          display: flex; flex-direction: column; transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .plan-card:hover { transform: translateY(-8px); background: rgba(255, 255, 255, 0.06); border-color: rgba(59, 130, 246, 0.4); }
        .plan-card.recommended { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .plan-card.recommended::before {
          content: 'MOST POPULAR'; position: absolute; top: 0; left: 0; right: 0; background: linear-gradient(90deg, #2563eb, #3b82f6);
          color: #fff; font-size: 11px; font-weight: 800; text-align: center; padding: 6px 0; letter-spacing: 0.1em;
        }
        .plan-price { font-size: 32px; font-weight: 900; color: #fff; margin: 12px 0 4px; line-height: 1.1; display: flex; align-items: baseline; gap: 4px; flex-wrap: nowrap; }
        .plan-features { flex: 1; margin: 16px 0; display: flex; flex-direction: column; gap: 10px; }
        .plan-feat-item { display: flex; align-items: flex-start; gap: 10px; color: rgba(255, 255, 255, 0.7); font-size: 13px; line-height: 1.4; }
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

        <div className={`auth-container ${view === "plans" || view === "prefill" ? 'expanded' : ''}`}>
          {/* LEFT: Branding panel */}
          <div className="auth-left">
            {/* Top-left Logo — matches landing page style */}
            <div className="auth-logo">
              <img src="/selleriq-icon.png" alt="SellerIQ Pro" className="auth-logo-icon" />
              <div className="auth-logo-wordmark">
                <div className="auth-logo-name">SellerIQ <span>Pro</span></div>
                <div className="auth-logo-tagline">Commerce Intelligence</div>
              </div>
            </div>

            <div className="brand-badge">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#60a5fa", boxShadow: "0 0 10px #60a5fa" }}></span>
              SELLERIQ ENTERPRISE
            </div>
            <h1 style={{ color: "#fff", fontSize: 36, fontWeight: 800, marginBottom: 14, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              SellerIQ<span style={{ color: "#60a5fa" }}>Pro</span>
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginBottom: 40, maxWidth: 380, lineHeight: 1.65, fontWeight: 400 }}>
              The definitive intelligence platform giving e-commerce brands absolute clarity over their sales, risk, and growth.
            </p>
            <div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><BarChart2 size={22} color="#60a5fa" /></div>
                <div><div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 3 }}>Real-time Intelligence</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Deep insights into overall sales performance.</div></div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><ShieldCheck size={22} color="#fbbf24" /></div>
                <div><div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 3 }}>Predictive Fraud Defense</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Identify high-risk return offenders instantly.</div></div>
              </div>
              <div className="feature-item">
                <div className="feature-icon-wrapper"><TrendingUp size={22} color="#34d399" /></div>
                <div><div style={{ fontWeight: 700, color: "#fff", fontSize: 14, marginBottom: 3 }}>Algorithmic Forecasting</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Data-driven revenue and trajectory models.</div></div>
              </div>
            </div>
          </div>

          {/* RIGHT: Dynamic view */}
          <div className={`auth-right ${view === "plans" || view === "prefill" ? 'expanded-view' : ''}`}>

            {/* ── PLANS ── */}
            {view === "plans" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                  <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 10px" }}>Select a SaaS Plan</h2>
                  <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 15, margin: 0 }}>Initialize your workspace by activating your subscription.</p>
                  
                </div>
                <div className="plans-grid">
                  {SaaS_PLANS.map(basePlan => {
                    const planPrice = basePlan.prices[billingCycle];
                    const plan = {
                      ...basePlan,
                      displayPrice: planPrice,
                      label: billingCycle === 1 ? ' / mo' : ` / ${billingCycle} mo`,
                      price: planPrice
                    };
                    return (
                    <div key={plan.id} className={`plan-card ${plan.recommended ? 'recommended' : ''}`}>
                      <h3 style={{ color: '#fff', margin: plan.recommended ? '16px 0 0' : '4px 0 0', fontSize: 18, fontWeight: 800 }}>{plan.name}</h3>
                      <div className="plan-price">
                        <span style={{ fontSize: 16, verticalAlign: 'top', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>₹</span>
                        <span>{plan.displayPrice.toLocaleString('en-IN')}</span>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500, whiteSpace: 'nowrap' }}>{plan.label}</span>
                      </div>
                      <div className="plan-features">
                        {plan.features.map((f, i) => (
                          <div key={i} className="plan-feat-item">
                            <CheckCircle size={18} color={plan.recommended ? "#3b82f6" : "#4ade80"} style={{ flexShrink: 0 }} />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => handleSelectPlan({ ...plan, price: plan.displayPrice })} className={`subscribe-btn ${plan.recommended ? 'btn-filled' : 'btn-outline'}`}>
                        Subscribe — ₹{plan.displayPrice.toLocaleString('en-IN')}{plan.label} <CreditCard size={18} />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/auth/bypass-login', {
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
                    );
                  })}
                </div>
                <div className="footer-nav">
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Already have an account?</span>
                  <button className="text-btn" onClick={() => resetForm("user_login")}>
                    Workspace Login <ArrowRight size={14} />
                  </button>
                </div>
              </>
            )}

            {/* ── PREFILL FORM (Hostinger-style checkout) ── */}
            {view === "prefill" && prefillPlan && (() => {
              const basePrice = prefillPlan.prices ? prefillPlan.prices[billingCycle] : prefillPlan.price;
              const monthlyRate = Math.round(basePrice / billingCycle);
              const standardMonthlyRate = prefillPlan.prices ? prefillPlan.prices[1] : basePrice;
              const standardPrice = standardMonthlyRate * billingCycle;
              const discountPct = billingCycle === 12 ? 15 : billingCycle === 24 ? 25 : billingCycle === 48 ? 40 : 0;
              const amountSaved = standardPrice - basePrice;
              const gstAmount = Math.round(basePrice * 0.18);
              const totalAmount = basePrice + gstAmount;
              const standardTotal = standardPrice + Math.round(standardPrice * 0.18);

              const planIcons = { starter: '📊', pro: '🚀', enterprise: '🏢' };
              const planIcon = planIcons[prefillPlan.id] || '📦';

              return (
              <div style={{ animation: "slideIn 0.3s ease-out", display: 'flex', gap: 40, width: '100%', alignItems: 'flex-start' }}>

                {/* ── LEFT: Your Cart + Billing Form ── */}
                <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Back link */}
                  <button onClick={() => resetForm("plans")} className="text-btn" style={{ color: "rgba(255,255,255,0.5)", alignSelf: 'flex-start', padding: 0 }}>
                    <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Your cart
                  </button>

                  {/* ── Plan Card (Hostinger style) ── */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '24px 28px' }}>
                    
                    {/* Plan header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{planIcon}</div>
                      <div>
                        <div style={{ color: '#fff', fontSize: 17, fontWeight: 800 }}>{prefillPlan.name} plan</div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>SellerIQ Pro Subscription</div>
                      </div>
                    </div>

                    {/* Period selector row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Period</label>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            value={billingCycle}
                            onChange={(e) => setBillingCycle(Number(e.target.value))}
                            style={{ appearance: 'none', WebkitAppearance: 'none', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', padding: '10px 40px 10px 16px', borderRadius: 10, fontSize: 15, fontWeight: 600, outline: 'none', cursor: 'pointer', minWidth: 160 }}
                          >
                            <option value={1} style={{ background: '#0f172a' }}>1 month</option>
                            <option value={12} style={{ background: '#0f172a' }}>12 months</option>
                            <option value={24} style={{ background: '#0f172a' }}>24 months</option>
                            <option value={48} style={{ background: '#0f172a' }}>48 months</option>
                          </select>
                          <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
                        </div>
                      </div>

                      {/* Price per month + savings */}
                      <div style={{ textAlign: 'right' }}>
                        {discountPct > 0 && (
                          <div style={{ display: 'inline-block', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 20, marginBottom: 6 }}>
                            Save ₹{amountSaved.toLocaleString('en-IN')}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'flex-end' }}>
                          <span style={{ color: '#fff', fontSize: 26, fontWeight: 900 }}>₹{monthlyRate.toLocaleString('en-IN')}<span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>/mo</span></span>
                          {discountPct > 0 && <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>₹{standardMonthlyRate.toLocaleString('en-IN')}/mo</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4 }}>
                          Renews at ₹{standardMonthlyRate.toLocaleString('en-IN')}/mo. Cancel anytime.
                        </div>
                      </div>
                    </div>

                    {/* Promo banner */}
                    {billingCycle < 48 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>%</div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                            Switch to a <strong>48-month subscription</strong> for the <strong>biggest savings</strong>. Save up to 40% on your plan.
                          </div>
                        </div>
                        <button
                          onClick={() => setBillingCycle(48)}
                          style={{ flexShrink: 0, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Get deal
                        </button>
                      </div>
                    )}

                    {/* Perks notice */}
                    {billingCycle >= 12 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: '#34d399', fontSize: 13 }}>
                        <CheckCircle size={15} style={{ flexShrink: 0 }} />
                        {billingCycle === 48
                          ? 'Great news! Setup fee waived + Priority onboarding included with this order.'
                          : 'Great news! Setup fee waived with this order.'}
                      </div>
                    )}
                  </div>

                  {/* ── Billing Details Form ── */}
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '24px 28px' }}>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <User size={18} color="#6366f1" /> Billing Details
                    </h3>
                    <form onSubmit={handlePrefillSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
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
                        <input type="email" className="custom-input" placeholder="Email Address" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} required />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <MapPin size={20} className="input-icon" />
                        <input type="text" className="custom-input" placeholder="Billing Address (Optional)" />
                      </div>
                      {prefillErr && <div className="err-box" style={{ marginTop: 16 }}>{prefillErr}</div>}
                    </form>
                    
                    <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 16px', gap: 16 }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700 }}>OR AUTO-FILL WITH</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <GoogleLogin
                        onSuccess={handleGooglePrefill}
                        onError={handleGoogleError}
                        theme="outline"
                        shape="pill"
                        text="signup_with"
                        width="100%"
                      />
                    </div>
                  </div>
                </div>

                {/* ── RIGHT: Order Summary ── */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px' }}>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 800, margin: '0 0 20px' }}>Order summary</h3>

                    {/* Plan + period line */}
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{prefillPlan.name} plan</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{billingCycle === 1 ? '1-month period' : `${billingCycle}-month period`}</span>
                        <div style={{ textAlign: 'right' }}>
                          {discountPct > 0 && <div style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>₹{standardPrice.toLocaleString('en-IN')}</div>}
                          <div style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>₹{basePrice.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Setup fee */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Enterprise setup fee</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>₹1,500</span>
                        <span style={{ color: '#34d399', fontSize: 13, fontWeight: 700 }}>₹0</span>
                      </div>
                    </div>

                    {/* Taxes */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 6, borderTop: '1px dashed rgba(255,255,255,0.08)', marginBottom: 14 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, borderBottom: '1px dotted rgba(255,255,255,0.3)', cursor: 'help' }} title="18% GST applicable on all plans">Taxes ⓘ</span>
                      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>₹{gstAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {/* Total */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: 20 }}>
                      <span style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>Total</span>
                      <div style={{ textAlign: 'right' }}>
                        {discountPct > 0 && <div style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>₹{standardTotal.toLocaleString('en-IN')}</div>}
                        <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Coupon */}
                    <a href="#" style={{ display: 'block', color: '#818cf8', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 20 }}>Have a coupon code?</a>

                    {/* CTA Button */}
                    <button
                      onClick={handlePrefillSubmit}
                      disabled={isLoading}
                      style={{
                        width: '100%', padding: '16px', borderRadius: 12, border: 'none',
                        background: isLoading ? '#475569' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        color: '#fff', fontSize: 16, fontWeight: 800, cursor: isLoading ? 'wait' : 'pointer',
                        boxShadow: '0 8px 24px rgba(99,102,241,0.35)', transition: 'all 0.2s', marginBottom: 16
                      }}
                    >
                      {isLoading ? 'Opening Checkout...' : 'Continue →'}
                    </button>

                    {/* Trust badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                        <ShieldCheck size={14} color="#34d399" /> 30-day money-back guarantee
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                        <Lock size={14} color="#60a5fa" /> 256-bit SSL encrypted checkout
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                        <CreditCard size={14} color="#a78bfa" /> Secured by Razorpay
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              );
            })()}

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

            {/* ── USER LOGIN / REGISTER ── */}
            {(view === "user_login" || view === "register") && (
              <>
                {/* Session-expired notice */}
                {sessionExpiredMsg && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeIn 0.4s ease' }}>
                    <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ color: '#fca5a5', fontWeight: 800, fontSize: 14 }}>Session Expired</div>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 }}>Your subscription plan has expired. Please login and recharge to continue.</div>
                    </div>
                  </div>
                )}

                {/* Login / Register toggle tabs */}
                <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 4, marginBottom: 32 }}>
                  <button
                    onClick={() => resetForm('user_login')}
                    style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.25s', fontFamily: "'Inter', sans-serif",
                      background: view === 'user_login' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                      color: view === 'user_login' ? '#fff' : 'rgba(255,255,255,0.4)',
                      boxShadow: view === 'user_login' ? '0 4px 12px rgba(37,99,235,0.35)' : 'none'
                    }}
                  >Login</button>
                  <button
                    onClick={() => resetForm('register')}
                    style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.25s', fontFamily: "'Inter', sans-serif",
                      background: view === 'register' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
                      color: view === 'register' ? '#fff' : 'rgba(255,255,255,0.4)',
                      boxShadow: view === 'register' ? '0 4px 12px rgba(37,99,235,0.35)' : 'none'
                    }}
                  >Register</button>
                </div>

                {/* ── LOGIN VIEW ── */}
                {view === 'user_login' && (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 36, animation: "slideIn 0.3s ease-out" }}>
                      <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.05))", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
                        <Briefcase size={32} color="#60a5fa" />
                      </div>
                      <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>Client Login</h2>
                      <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 14, margin: 0 }}>Access your workspace dashboard.</p>
                    </div>
                    <form onSubmit={handleClientLogin}>
                      <div className="input-group">
                        <Mail size={22} className="input-icon" />
                        <input type="email" className="custom-input" placeholder="Registered Email" value={user} onChange={e => setUser(e.target.value)} required />
                      </div>
                      <div className="input-group" style={{ position: 'relative' }}>
                        <Lock size={22} className="input-icon" />
                        <input type={showPass ? "text" : "password"} className="custom-input" placeholder="Your Password" value={pass} onChange={e => setPass(e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}>
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {err && <div className="err-box">{err}</div>}
                      {msg && <div className="success-badge"><CheckCircle size={18} />{msg}</div>}
                      <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? "Authenticating..." : "Login to Dashboard"}
                        {!isLoading && <ArrowRight size={20} />}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', gap: 16 }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700 }}>OR</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_black" shape="pill" width={380} text="continue_with" />
                      </div>
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

                {/* ── REGISTER VIEW ── */}
                {view === 'register' && (
                  <>
                    <div style={{ textAlign: "center", marginBottom: 28, animation: "slideIn 0.3s ease-out" }}>
                      <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.05))", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                        <Sparkles size={32} color="#818cf8" />
                      </div>
                      <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 800, margin: "0 0 8px" }}>Create Account</h2>
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0 }}>Verify your email and get started for free.</p>
                    </div>

                    {regErr && <div className="err-box">{regErr}</div>}
                    {regMsg && <div className="success-badge"><CheckCircle size={18} />{regMsg}</div>}

                    <form onSubmit={handleRegister}>
                      {/* Name */}
                      <div className="input-group">
                        <User size={20} className="input-icon" />
                        <input type="text" className="custom-input" placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} required />
                      </div>

                      {/* Phone */}
                      <div className="input-group">
                        <Phone size={20} className="input-icon" />
                        <input type="tel" className="custom-input" placeholder="Phone Number" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                      </div>

                      {/* Email + Send OTP */}
                      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                        <div style={{ flex: 1, position: 'relative' }}>
                          <Mail size={20} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)' }} />
                          <input type="email" className="custom-input" placeholder="Gmail Address" value={regEmail}
                            onChange={e => setRegEmail(e.target.value)} required disabled={otpSent}
                            style={{ paddingLeft: 54 }}
                          />
                        </div>
                        <button type="button"
                          onClick={handleSendOtp}
                          disabled={otpLoading || otpSent}
                          style={{
                            padding: '0 16px', borderRadius: 14, border: `1px solid ${otpSent ? '#10b981' : '#3b82f6'}`,
                            background: otpSent ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.15)',
                            color: otpSent ? '#34d399' : '#60a5fa',
                            fontSize: 12, fontWeight: 700, cursor: otpSent ? 'default' : 'pointer',
                            whiteSpace: 'nowrap', transition: 'all 0.2s', fontFamily: "'Inter', sans-serif",
                            opacity: otpLoading ? 0.6 : 1
                          }}
                        >
                          {otpLoading ? 'Sending...' : otpSent ? '✓ Sent' : 'Send OTP'}
                        </button>
                      </div>

                      {/* OTP Input */}
                      {otpSent && (
                        <div className="input-group">
                          <input
                            type="text"
                            className="custom-input"
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            value={regOtp}
                            onChange={e => setRegOtp(e.target.value.replace(/\D/g, ''))}
                            style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: 8, fontFamily: 'monospace', paddingLeft: 20 }}
                            required
                          />
                        </div>
                      )}

                      {/* Password */}
                      <div className="input-group" style={{ position: 'relative' }}>
                        <Lock size={20} className="input-icon" />
                        <input type={showPass ? "text" : "password"} className="custom-input" placeholder="Password (min 8 chars)" value={regPass} onChange={e => setRegPass(e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}>
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      {/* Confirm Password */}
                      <div className="input-group" style={{ position: 'relative', marginBottom: 0 }}>
                        <Lock size={20} className="input-icon" />
                        <input type={showConfirmPass ? "text" : "password"} className="custom-input" placeholder="Confirm Password" value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} required />
                        <button type="button" onClick={() => setShowConfirmPass(p => !p)} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4 }}>
                          {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>

                      <button type="submit" className="auth-btn" disabled={regLoading || !otpSent}
                        style={{ marginTop: 20, background: regLoading || !otpSent ? 'linear-gradient(135deg,#475569,#334155)' : 'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}
                      >
                        {regLoading ? 'Creating Account...' : <><Sparkles size={18} /> Create Account</>}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 14px', gap: 16 }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700 }}>OR SIGN UP WITH</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="filled_black" shape="pill" width={380} text="signup_with" />
                      </div>
                    </form>
                    <div className="footer-nav">
                      <button className="text-btn" onClick={() => resetForm("plans")} style={{ color: "rgba(255,255,255,0.7)" }}>
                        <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Plans
                      </button>
                    </div>
                  </>
                )}
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
