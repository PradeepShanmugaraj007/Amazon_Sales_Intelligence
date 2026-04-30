import React, { useState, useEffect } from "react";
import { X, Mail, Lock, User, ArrowRight, CheckCircle, Eye, EyeOff, ShieldCheck, Sparkles, Phone } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

const LoginRegisterModal = ({ onClose, onLogin }) => {
  const [tab, setTab] = useState("login"); // "login" | "register"

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMsg, setLoginMsg] = useState("");

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

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ── Login handler ─────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErr("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginErr(data.detail || "Login failed.");
        setLoginLoading(false);
        return;
      }
      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      sessionStorage.setItem("siq_plan_expiry", data.user.plan_expiry || "");
      sessionStorage.setItem("siq_plan_status", JSON.stringify(data.plan_status || {}));
      localStorage.setItem("userEmail", data.user.email);
      setLoginMsg("Welcome back, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats, data.plan_status, "upload"), 800);
    } catch {
      setLoginErr("Unable to reach the server.");
      setLoginLoading(false);
    }
  };

  // ── Google login handler ───────────────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoginLoading(true);
    setLoginErr("");
    try {
      const res = await fetch("/api/v1/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginErr(data.detail || "Google login failed.");
        setLoginLoading(false);
        return;
      }
      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      if (data.user.picture) sessionStorage.setItem("siq_user_picture", data.user.picture);
      sessionStorage.setItem("siq_plan_expiry", data.user.plan_expiry || "");
      sessionStorage.setItem("siq_plan_status", JSON.stringify(data.plan_status || {}));
      localStorage.setItem("userEmail", data.user.email);
      setLoginMsg("Welcome, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats, data.plan_status, "upload"), 800);
    } catch {
      setLoginErr("Google authentication failed.");
      setLoginLoading(false);
    }
  };

  // ── Send OTP handler ───────────────────────────────────────────────────────
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
      if (!res.ok) {
        setRegErr(data.detail || "Failed to send OTP.");
        setOtpLoading(false);
        return;
      }
      setOtpSent(true);
      setRegMsg("✅ OTP sent to " + regEmail + ". Check your inbox!");
      setOtpLoading(false);
    } catch {
      setRegErr("Could not reach server to send OTP.");
      setOtpLoading(false);
    }
  };

  // ── Register handler ───────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegErr("");
    if (!otpSent) { setRegErr("Please request and verify your OTP first."); return; }
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
      if (!res.ok) {
        setRegErr(data.detail || "Registration failed.");
        setRegLoading(false);
        return;
      }
      sessionStorage.setItem("siq_auth_token", data.access_token);
      sessionStorage.setItem("siq_user_name", data.user.name);
      sessionStorage.setItem("siq_plan_expiry", data.user.plan_expiry || "");
      sessionStorage.setItem("siq_plan_status", JSON.stringify(data.plan_status || {}));
      localStorage.setItem("userEmail", data.user.email);
      setRegMsg("🎉 Account created! Welcome, " + data.user.name + "!");
      setTimeout(() => onLogin("user", data.user.plan, data.user.usageStats, data.plan_status, "demo"), 1000);
    } catch {
      setRegErr("Could not reach server.");
      setRegLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .lrm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: lrmFadeIn 0.25s ease;
        }
        @keyframes lrmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lrmSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .lrm-card {
          width: 100%; max-width: 460px;
          background: linear-gradient(135deg, #0f172a, #111827);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 28px;
          box-shadow: 0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04);
          overflow: hidden;
          animation: lrmSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          max-height: 90vh;
          overflow-y: auto;
        }
        .lrm-card::-webkit-scrollbar { width: 4px; }
        .lrm-card::-webkit-scrollbar-track { background: transparent; }
        .lrm-card::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .lrm-header {
          padding: 28px 28px 0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .lrm-close {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.6);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .lrm-close:hover { background: rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.4); color: #ef4444; }

        .lrm-tabs {
          display: flex; gap: 4px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 4px;
          margin: 20px 28px 0;
        }
        .lrm-tab {
          flex: 1; padding: 10px; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: all 0.25s; background: transparent; color: rgba(255,255,255,0.4);
          font-family: 'Inter', sans-serif;
        }
        .lrm-tab.active {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          box-shadow: 0 4px 12px rgba(37,99,235,0.35);
        }

        .lrm-body { padding: 24px 28px 28px; }

        .lrm-input-group { position: relative; margin-bottom: 14px; }
        .lrm-input-icon {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.3);
        }
        .lrm-input {
          width: 100%; padding: 14px 16px 14px 46px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #fff;
          font-size: 14px; outline: none; transition: all 0.25s;
          box-sizing: border-box; font-family: 'Inter', sans-serif;
        }
        .lrm-input::placeholder { color: rgba(255,255,255,0.25); }
        .lrm-input:focus { border-color: #3b82f6; background: rgba(255,255,255,0.07); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }

        .lrm-otp-row { display: flex; gap: 8px; }
        .lrm-otp-input {
          flex: 1; padding: 14px 16px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #fff;
          font-size: 18px; font-weight: 800; text-align: center; letter-spacing: 4px;
          outline: none; transition: all 0.25s; font-family: monospace;
        }
        .lrm-otp-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        
        .lrm-send-otp-btn {
          padding: 14px 16px; border-radius: 12px; border: 1px solid #3b82f6;
          background: rgba(59,130,246,0.15); color: #60a5fa;
          font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap;
          transition: all 0.2s; font-family: 'Inter', sans-serif;
        }
        .lrm-send-otp-btn:hover:not(:disabled) { background: rgba(59,130,246,0.25); }
        .lrm-send-otp-btn:disabled { opacity: 0.5; cursor: wait; }
        .lrm-send-otp-btn.sent { border-color: #10b981; color: #34d399; background: rgba(16,185,129,0.12); }

        .lrm-eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); transition: color 0.2s; padding: 4px;
        }
        .lrm-eye-btn:hover { color: rgba(255,255,255,0.7); }

        .lrm-btn {
          width: 100%; padding: 16px;
          border-radius: 14px; border: none;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.25s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 6px 20px rgba(37,99,235,0.3);
          font-family: 'Inter', sans-serif; margin-top: 6px;
        }
        .lrm-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(37,99,235,0.4); }
        .lrm-btn:disabled { opacity: 0.6; cursor: wait; background: linear-gradient(135deg, #475569, #334155); box-shadow: none; }

        .lrm-err { color: #fca5a5; font-size: 13px; font-weight: 600; margin-bottom: 14px; text-align: center; background: rgba(239,68,68,0.12); padding: 10px; border-radius: 10px; border: 1px solid rgba(239,68,68,0.25); }
        .lrm-success { color: #34d399; font-size: 13px; font-weight: 600; margin-bottom: 14px; background: rgba(16,185,129,0.1); padding: 10px; border-radius: 10px; border: 1px solid rgba(16,185,129,0.25); display: flex; align-items: center; gap: 8px; }
        
        .lrm-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .lrm-divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.08); }
        .lrm-divider-text { color: rgba(255,255,255,0.25); font-size: 11px; font-weight: 700; }

        .lrm-switch-text {
          text-align: center; margin-top: 16px; color: rgba(255,255,255,0.4); font-size: 13px;
        }
        .lrm-switch-btn {
          background: none; border: none; color: #60a5fa; font-size: 13px; font-weight: 700;
          cursor: pointer; padding: 0 4px; font-family: 'Inter', sans-serif;
        }
        .lrm-switch-btn:hover { text-decoration: underline; }
      `}</style>

      <div className="lrm-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="lrm-card">
          {/* Header */}
          <div className="lrm-header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck size={18} color="#fff" />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>SellerIQ Pro</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600 }}>Sign in to continue</div>
              </div>
            </div>
            <button className="lrm-close" onClick={onClose}><X size={16} /></button>
          </div>

          {/* Tabs */}
          <div className="lrm-tabs">
            <button className={`lrm-tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setLoginErr(""); setRegErr(""); }}>
              Login
            </button>
            <button className={`lrm-tab ${tab === "register" ? "active" : ""}`} onClick={() => { setTab("register"); setLoginErr(""); setRegErr(""); }}>
              Register
            </button>
          </div>

          <div className="lrm-body">
            {/* ── LOGIN TAB ── */}
            {tab === "login" && (
              <form onSubmit={handleLogin}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
                  Access your SellerIQ Pro workspace.
                </p>
                {loginErr && <div className="lrm-err">{loginErr}</div>}
                {loginMsg && <div className="lrm-success"><CheckCircle size={15} />{loginMsg}</div>}
                <div className="lrm-input-group">
                  <Mail size={18} className="lrm-input-icon" />
                  <input type="email" className="lrm-input" placeholder="Email address" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
                </div>
                <div className="lrm-input-group" style={{ position: "relative" }}>
                  <Lock size={18} className="lrm-input-icon" />
                  <input type={showPass ? "text" : "password"} className="lrm-input" placeholder="Password" value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
                  <button type="button" className="lrm-eye-btn" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button type="submit" className="lrm-btn" disabled={loginLoading}>
                  {loginLoading ? "Signing in..." : <><span>Login to Dashboard</span><ArrowRight size={16} /></>}
                </button>

                <div className="lrm-divider">
                  <div className="lrm-divider-line" /><span className="lrm-divider-text">OR</span><div className="lrm-divider-line" />
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setLoginErr("Google login failed.")} theme="filled_black" shape="pill" width={380} text="continue_with" />
                </div>

                <div className="lrm-switch-text">
                  Don't have an account?{" "}
                  <button type="button" className="lrm-switch-btn" onClick={() => setTab("register")}>Register here</button>
                </div>
              </form>
            )}

            {/* ── REGISTER TAB ── */}
            {tab === "register" && (
              <form onSubmit={handleRegister}>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 20, textAlign: "center" }}>
                  Create a free account to save your work.
                </p>
                {regErr && <div className="lrm-err">{regErr}</div>}
                {regMsg && <div className="lrm-success"><CheckCircle size={15} />{regMsg}</div>}

                {/* Name */}
                <div className="lrm-input-group">
                  <User size={18} className="lrm-input-icon" />
                  <input type="text" className="lrm-input" placeholder="Full Name" value={regName} onChange={e => setRegName(e.target.value)} required />
                </div>

                {/* Phone */}
                <div className="lrm-input-group">
                  <Phone size={18} className="lrm-input-icon" />
                  <input type="tel" className="lrm-input" placeholder="Phone Number" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
                </div>

                {/* Email + Send OTP */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <Mail size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type="email" className="lrm-input" placeholder="Gmail address"
                      value={regEmail} onChange={e => setRegEmail(e.target.value)}
                      style={{ paddingLeft: 46 }} required
                      disabled={otpSent}
                    />
                  </div>
                  <button
                    type="button"
                    className={`lrm-send-otp-btn ${otpSent ? "sent" : ""}`}
                    onClick={handleSendOtp}
                    disabled={otpLoading || otpSent}
                  >
                    {otpLoading ? "Sending..." : otpSent ? "✓ OTP Sent" : "Send OTP"}
                  </button>
                </div>

                {/* OTP input */}
                {otpSent && (
                  <div className="lrm-input-group">
                    <input
                      type="text" className="lrm-otp-input"
                      placeholder="· · · · · ·"
                      maxLength={6} value={regOtp}
                      onChange={e => setRegOtp(e.target.value.replace(/\D/g, ""))}
                      required
                    />
                  </div>
                )}

                {/* Password */}
                <div className="lrm-input-group" style={{ position: "relative" }}>
                  <Lock size={18} className="lrm-input-icon" />
                  <input
                    type={showPass ? "text" : "password"} className="lrm-input"
                    placeholder="Password (min 8 chars)"
                    value={regPass} onChange={e => setRegPass(e.target.value)} required
                  />
                  <button type="button" className="lrm-eye-btn" onClick={() => setShowPass(p => !p)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="lrm-input-group" style={{ position: "relative" }}>
                  <Lock size={18} className="lrm-input-icon" />
                  <input
                    type={showConfirmPass ? "text" : "password"} className="lrm-input"
                    placeholder="Confirm Password"
                    value={regConfirmPass} onChange={e => setRegConfirmPass(e.target.value)} required
                  />
                  <button type="button" className="lrm-eye-btn" onClick={() => setShowConfirmPass(p => !p)}>
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <button type="submit" className="lrm-btn" disabled={regLoading || !otpSent}>
                  {regLoading ? "Creating Account..." : <><Sparkles size={16} /><span>Create Account</span></>}
                </button>

                <div className="lrm-divider">
                  <div className="lrm-divider-line" /><span className="lrm-divider-text">OR SIGN UP WITH</span><div className="lrm-divider-line" />
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setRegErr("Google signup failed.")} theme="filled_black" shape="pill" width={380} text="signup_with" />
                </div>

                <div className="lrm-switch-text">
                  Already have an account?{" "}
                  <button type="button" className="lrm-switch-btn" onClick={() => setTab("login")}>Login</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginRegisterModal;
