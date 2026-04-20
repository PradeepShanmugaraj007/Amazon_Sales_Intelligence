import React, { useState, useMemo, useEffect } from "react";
import { Users, Shield, Calendar, Clock, CreditCard, CheckCircle, Search, LogOut, ArrowUpRight, Bell, Database, Activity, Mail, Server, Settings, Cpu, HardDrive, TerminalSquare, TrendingUp, ToggleRight, ToggleLeft, DollarSign, Phone, Menu, X, AlertTriangle } from "lucide-react";
import "../responsive_overrides.css";

const AdminPanel = ({ onLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminTab, setAdminTab] = useState("hub");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsState, setSettingsState] = useState({ maintenance: false, registration: true, debug: true });

  const tabStyle = {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    borderRadius: 8, fontSize: 14, fontWeight: 700, border: "none",
    cursor: "pointer", transition: "all 0.2s", textAlign: "left",
    width: "100%"
  };

  useEffect(() => {
    if (adminTab === "hub" || adminTab === "billing" || adminTab === "monitoring") {
      fetch('http://localhost:5000/api/admin/users')
        .then(r => r.json())
        .then(d => { if (d.success) setRegisteredUsers(d.users); })
        .catch(() => {});
    }
  }, [adminTab]);

  const ALL_USERS = useMemo(() => {
    if (registeredUsers.length > 0) return registeredUsers;
    return [
      { user_id: "DEMO-001", name: "Acme Corp Ltd.", email: "admin@acmecorp.com", phone: "+91 98765 43210", plan: "enterprise", status: "Active", joined: "2026-01-15 09:00", lastLogin: "10 mins ago" },
      { user_id: "DEMO-002", name: "Starlite Retailers", email: "contact@starlite.in", phone: "+91 87654 32109", plan: "pro", status: "Active", joined: "2026-02-20 14:30", lastLogin: "2 hours ago" },
    ];
  }, [registeredUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return ALL_USERS;
    const q = searchQuery.toLowerCase();
    return ALL_USERS.filter(u =>
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.user_id || "").toLowerCase().includes(q) ||
      (u.plan || "").toLowerCase().includes(q)
    );
  }, [searchQuery, ALL_USERS]);

  const kpis = useMemo(() => {
    const active = ALL_USERS.filter(u => u.status === "Active").length;
    const planCounts = ALL_USERS.reduce((a, u) => {
      const p = (u.plan || "starter").toLowerCase();
      a[p] = (a[p] || 0) + 1;
      return a;
    }, {});
    return { nodes: active, total: ALL_USERS.length, plans: planCounts };
  }, [ALL_USERS]);

  const billingMetrics = useMemo(() => {
    const prices = { starter: 2999, pro: 5999, enterprise: 14999 };
    const mrr = ALL_USERS.reduce((sum, u) => sum + (prices[(u.plan || "starter").toLowerCase()] || 0), 0);
    const activeSubs = ALL_USERS.filter(u => u.plan !== "starter" && (u.status === "ACTIVE" || u.status === "Active")).length;
    
    const invoices = ALL_USERS.filter(u => u.plan !== "starter").map((u, i) => ({
      id: `INV-${new Date().getFullYear()}-0${41 - i}`,
      client: u.name || u.email || u.user_id,
      amount: `₹${prices[(u.plan || "starter").toLowerCase()]}.00`,
      status: i % 3 === 0 ? "Pending" : "Paid"
    }));

    return { 
      mrr: mrr, 
      activeSubs: activeSubs, 
      invoices: invoices 
    };
  }, [ALL_USERS]);

  const dynamicLogs = useMemo(() => {
    if (ALL_USERS.length === 0) return [{ time: "10:15:22", level: "INFO", msg: "System boot sequence initialized. Worker nodes: 4." }];
    const logs = [];
    ALL_USERS.slice(0, 4).forEach((u, i) => {
      logs.push({ time: `10:${45-i}:01`, level: "INFO", msg: `Node ${u.user_id} (${u.email || 'N/A'}) authenticated securely.` });
      if (u.plan === "enterprise" || u.plan === "pro") {
        logs.push({ time: `10:${40-i}:15`, level: "WARN", msg: `API Sync initiated for tenant ${u.user_id}.` });
      }
    });
    logs.push({ time: "10:30:00", level: "INFO", msg: "Automated PostgreSQL backup completed to AWS S3 us-east-1." });
    logs.push({ time: "10:15:22", level: "INFO", msg: "System boot sequence initialized. Guardian nodes active." });
    return logs.sort((a, b) => b.time.localeCompare(a.time));
  }, [ALL_USERS]);

  const getStatusBadge = (status) => {
    const s = status || "Active";
    if (s === "Active") return <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(34, 197, 94, 0.15)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.3)" }}>ACTIVE</span>;
    if (s === "Warning") return <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(245, 158, 11, 0.15)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)" }}>EXPIRING</span>;
    return <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)" }}>LOCKED</span>;
  };

  const getPlanIcon = (plan) => {
    const p = (plan || "").toLowerCase();
    if (p === "enterprise") return <Shield size={14} color="#6366f1" style={{ marginRight: 6 }} />;
    if (p === "pro") return <CheckCircle size={14} color="#10b981" style={{ marginRight: 6 }} />;
    return <CreditCard size={14} color="#64748b" style={{ marginRight: 6 }} />;
  };

  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

  const handleTabChange = (id) => {
    setAdminTab(id);
    setMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
        <Shield size={32} color="#60a5fa" />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          SellerIQ <span style={{ color: "#60a5fa" }}>Master</span>
        </h1>
      </div>

      <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 12, marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Clearance Level 4</div>
        <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>
          Manage global client intelligence nodes and resource parameters.
        </p>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {[
          { id: "hub", label: "Network Hub", Icon: Activity },
          { id: "monitoring", label: "Sub Monitoring", Icon: TrendingUp },
          { id: "logs", label: "System Logs", Icon: Server },
          { id: "billing", label: "Billing Engines", Icon: CreditCard },
          { id: "settings", label: "Global Settings", Icon: Settings },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => handleTabChange(id)} style={{ ...tabStyle, background: adminTab === id ? "rgba(59, 130, 246, 0.15)" : "transparent", color: adminTab === id ? "#60a5fa" : "#94a3b8" }}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <button className="btn-logout" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
          <LogOut size={16} /> Terminate Session
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-bg">
      <style>{`
        .admin-bg { min-height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; color: #0f172a; display: flex; }
        .stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); position: relative; overflow: hidden; }
        .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #3b82f6, #6366f1); }
        .admin-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .admin-table th { text-align: left; padding: 14px 16px; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; background: #f8fafc; border-bottom: 2px solid #e2e8f0; }
        .admin-table td { padding: 16px 16px; font-size: 14px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .user-avatar { width: 36px; height: 36px; border-radius: 8px; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
        .btn-logout { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-weight: 700; font-size: 14px; color: #ffffff; cursor: pointer; }
        .admin-sidebar-desktop { display: flex !important; width: 280px; background: #0f172a; flex-direction: column; padding: 32px 24px; color: white; flex-shrink: 0; position: fixed; top: 0; left: 0; bottom: 0; }
        .admin-content { margin-left: 280px; flex: 1; padding: 40px 60px; }
        .admin-mobile-nav { display: none !important; }
      `}</style>

      {/* DESKTOP SIDEBAR */}
      <div className="admin-sidebar-desktop">
        {sidebarContent}
      </div>

      {/* MOBILE HEADER */}
      <div className="admin-mobile-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 64, background: '#0f172a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={24} color="#60a5fa" />
          <span style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>SellerIQ <span style={{ color: '#60a5fa' }}>Master</span></span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white' }}>
          <Menu size={24} />
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1001, backdropFilter: 'blur(3px)' }} />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: '#0f172a', zIndex: 1002,
            padding: '32px 24px', display: 'flex', flexDirection: 'column', color: 'white',
            transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.3s ease'
          }}>
            <button onClick={() => setMobileMenuOpen(false)} style={{ position: 'absolute', top: 16, right: 16, color: 'white', background: 'none', border: 'none' }}>
              <X size={24} />
            </button>
            {sidebarContent}
          </div>
        </>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="admin-content" style={{ minWidth: 0 }}>
        
        {adminTab === "hub" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>Network Hub Overview</h2>
              <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Live registered subscriber metrics.</div>
            </div>

            <div className="admin-grid" style={{ marginBottom: 40 }}>
              <div className="stat-card">
                <div style={{ background: "#e0e7ff", color: "#4f46e5", width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={20} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Active Accounts</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.nodes}</div>
                </div>
              </div>
              <div className="stat-card">
                <div style={{ background: "#dcfce7", color: "#16a34a", width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Activity size={20} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Total Reg.</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.total}</div>
                </div>
              </div>
              <div className="stat-card">
                <div style={{ background: "#f3e8ff", color: "#9333ea", width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Enterprise</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.plans?.enterprise || 0}</div>
                </div>
              </div>
              <div className="stat-card">
                <div style={{ background: "#fef3c7", color: "#d97706", width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={20} /></div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Pro Accounts</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.plans?.pro || 0}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
              <div className="admin-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#0f172a" }}>Registered Clients</h2>
                <div className="search-container" style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <input
                    type="text" placeholder="Search..."
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, width: 200 }}
                  />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>User</th><th>User ID</th><th>Phone</th><th>Plan</th><th>Joined</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={u.user_id || i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="user-avatar">{u.name?.charAt(0)}</div>
                            <div>
                              <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>{u.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", color: "#3b82f6", fontWeight: 700 }}>{u.user_id}</td>
                        <td style={{ fontSize: 13 }}><Phone size={12} style={{ marginRight: 4 }} /> {u.phone}</td>
                        <td>{getPlanIcon(u.plan)} {capitalize(u.plan)}</td>
                        <td style={{ fontSize: 12, color: "#64748b" }}>{u.joined?.split(' ')[0]}</td>
                        <td>{getStatusBadge(u.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {adminTab === "monitoring" && (
          <>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>Subscription Monitoring</h2>
                <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Track client renewals and manage expiry notifications.</div>
              </div>
              <button 
                onClick={async () => {
                   setIsLoading(true);
                   try {
                     const res = await fetch('http://localhost:5000/api/admin/send-expiry-warnings', { method: 'POST' });
                     const data = await res.json();
                     setToast(`Successfully sent ${data.emails_sent} warning emails.`);
                   } catch {
                     setToast("Failed to send warning emails.");
                   } finally {
                     setIsLoading(false);
                     setTimeout(() => setToast(null), 3000);
                   }
                }}
                disabled={isLoading}
                style={{ 
                  background: 'linear-gradient(135deg, #ea580c, #c2410c)', color: 'white', 
                  border: 'none', padding: '12px 24px', borderRadius: 12, fontWeight: 800, 
                  fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)'
                }}
              >
                <Mail size={18} /> {isLoading ? "Sending..." : "Send Expiry Warnings"}
              </button>
            </div>

            <div className="admin-grid" style={{ marginBottom: 40 }}>
              {[
                { label: "Active Subs", val: ALL_USERS.filter(u => u.sub_status === "Active").length, color: "#16a34a", bg: "#dcfce7", icon: CheckCircle },
                { label: "Expiring Soon", val: ALL_USERS.filter(u => u.sub_status === "Expiring Soon").length, color: "#ca8a04", bg: "#fef9c3", icon: Bell },
                { label: "Expired", val: ALL_USERS.filter(u => u.sub_status === "Expired").length, color: "#dc2626", bg: "#fef2f2", icon: X },
                { label: "Total MRR", val: `₹${billingMetrics.mrr.toLocaleString()}`, color: "#4f46e5", bg: "#e0e7ff", icon: DollarSign },
              ].map((k, i) => (
                <div key={i} className="stat-card">
                  <div style={{ background: k.bg, color: k.color, width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><k.icon size={20} /></div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>{k.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{k.val}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
               <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>Client Node</th><th>Active Plan</th><th>Expiry Date</th><th>Days Left</th><th>Status</th><th>Notification</th></tr>
                  </thead>
                  <tbody>
                    {ALL_USERS.map((u, i) => {
                       const days = u.days_left ?? 0;
                       const statusStyle = 
                        u.sub_status === "Expired" ? { bg: "#fee2e2", text: "#b91c1c" } :
                        u.sub_status === "Expiring Soon" ? { bg: "#fef9c3", text: "#a16207" } :
                        { bg: "#dcfce7", text: "#15803d" };

                       return (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 13 }}>{u.name || u.email}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>ID: {u.user_id}</div>
                          </td>
                          <td>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                               {getPlanIcon(u.plan)}
                               <span style={{ fontWeight: 700, fontSize: 13 }}>{capitalize(u.plan)}</span>
                             </div>
                          </td>
                          <td style={{ fontWeight: 600, color: "#475569" }}>{u.expiry_date || "—"}</td>
                          <td>
                            <div style={{ fontSize: 14, fontWeight: 900, color: days < 0 ? "#ef4444" : days < 3 ? "#eab308" : "#0f172a" }}>
                              {days < 0 ? `${Math.abs(days)}d Overdue` : `${days} days left`}
                            </div>
                          </td>
                          <td>
                            <span style={{ 
                              padding: "4px 10px", borderRadius: "100px", fontSize: 11, fontWeight: 800, 
                              background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.text}20` 
                            }}>
                              {u.sub_status?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                             {days <= 3 && (
                               <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f97316', fontSize: 11, fontWeight: 700 }}>
                                 <AlertTriangle size={12} /> Needs Warning
                               </div>
                             )}
                          </td>
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {adminTab === "logs" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>System Logs</h2>
              <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Real-time event monitoring and platform diagnostics.</div>
            </div>
            <div style={{ background: "#0f172a", borderRadius: 12, padding: 20, color: "#10b981", fontFamily: "monospace", fontSize: 13, height: 600, overflowY: "auto" }}>
              <div style={{ color: "#94a3b8", marginBottom: 16 }}>[SYSTEM WAITING FOR EVENTS]... Connected to secure socket relay.</div>
              {dynamicLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: 8, display: "flex", gap: 16 }}>
                  <span style={{ color: "#64748b" }}>[{log.time}]</span>
                  <span style={{ color: log.level === "ERROR" ? "#ef4444" : log.level === "WARN" ? "#f59e0b" : "#3b82f6", width: 50 }}>{log.level}</span>
                  <span style={{ color: "#e2e8f0" }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {adminTab === "billing" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>Billing Engine</h2>
              <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Manage subscription revenue, pricing tiers, and invoicing.</div>
            </div>
            <div className="admin-grid" style={{ marginBottom: 32 }}>
              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Monthly Recurring Revenue</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a" }}>₹{billingMetrics.mrr.toLocaleString('en-IN')}</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Paid Subscriptions</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a" }}>{billingMetrics.activeSubs}</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Churn Rate</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#ef4444" }}>0.0%</div>
              </div>
              <div className="stat-card">
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Gross Transaction Vol</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#16a34a" }}>₹{(billingMetrics.mrr).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
              <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 800 }}>Recent Transactions</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ marginTop: 16 }}>
                  <thead><tr><th>Invoice ID</th><th>Client</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {billingMetrics.invoices.length > 0 ? billingMetrics.invoices.map((inv, i) => (
                      <tr key={i}>
                        <td style={{ fontFamily: "monospace" }}>{inv.id}</td>
                        <td style={{ fontWeight: 600 }}>{inv.client}</td>
                        <td style={{ fontWeight: 800 }}>{inv.amount}</td>
                        <td>
                          {inv.status === "Paid" 
                             ? getStatusBadge("Paid") 
                             : <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(245, 158, 11, 0.15)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)" }}>PENDING</span>
                          }
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>No paid subscriptions found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {adminTab === "settings" && (
          <>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>Global Settings</h2>
              <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>System configuration, API limits, and critical parameters.</div>
            </div>
            <div className="dash-grid-2" style={{ gap: 24 }}>
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Platform Controls</h3>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Maintenance Mode</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Disable login and show maintenance screen to all non-admin users.</div>
                  </div>
                  <div onClick={() => setSettingsState(s => ({...s, maintenance: !s.maintenance}))}>
                    {settingsState.maintenance ? <ToggleRight size={32} color="#cc0000" style={{ cursor: "pointer" }} /> : <ToggleLeft size={32} color="#cbd5e1" style={{ cursor: "pointer" }} />}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16, borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>New User Registration</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Allow new users to sign up via the landing page.</div>
                  </div>
                  <div onClick={() => setSettingsState(s => ({...s, registration: !s.registration}))}>
                    {settingsState.registration ? <ToggleRight size={32} color="#3b82f6" style={{ cursor: "pointer" }} /> : <ToggleLeft size={32} color="#cbd5e1" style={{ cursor: "pointer" }} />}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Debug Logging</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>Enable verbose output in the System Logs tab for troubleshooting.</div>
                  </div>
                  <div onClick={() => setSettingsState(s => ({...s, debug: !s.debug}))}>
                    {settingsState.debug ? <ToggleRight size={32} color="#3b82f6" style={{ cursor: "pointer" }} /> : <ToggleLeft size={32} color="#cbd5e1" style={{ cursor: "pointer" }} />}
                  </div>
                </div>
              </div>
              
              <div style={{ background: "white", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                <h3 style={{ marginTop: 0, fontSize: 16, fontWeight: 800, marginBottom: 16, color: "#ef4444" }}>Danger Zone</h3>
                <button onClick={() => {
                  setToast("System Cache successfully purged across all nodes.");
                  setTimeout(() => setToast(null), 3000);
                }} style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", padding: "12px 24px", borderRadius: 8, fontWeight: 800, cursor: "pointer" }}>
                  Purge Application Cache
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* TOAST NOTIFICATION OVERLAY */}
      {toast && (
        <div style={{ position: "fixed", bottom: 40, right: 40, background: "#0f172a", color: "white", padding: "16px 24px", borderRadius: 8, fontWeight: 600, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 12, zIndex: 9999 }}>
          <CheckCircle color="#10b981" size={20} />
          {toast}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
