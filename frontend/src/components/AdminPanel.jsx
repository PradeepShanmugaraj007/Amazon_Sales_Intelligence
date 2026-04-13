import React, { useState, useMemo } from "react";
import { Users, Shield, Calendar, Clock, CreditCard, CheckCircle, Search, LogOut, ArrowUpRight, Bell, Database, Activity, Mail, Server, Settings, Cpu, HardDrive, TerminalSquare, TrendingUp, Power, ToggleRight, ToggleLeft, DollarSign } from "lucide-react";

// Mock user database
const MOCK_USERS = [
  { id: "1001", name: "Acme Corp Ltd.", email: "admin@acmecorp.com", plan: "Enterprise", status: "Active", expires: "2026-12-01", lastLogin: "10 mins ago", apiHits: "1.2M", dataVolume: "4.5 TB" },
  { id: "1002", name: "Starlite Retailers", email: "contact@starlite.in", plan: "Pro", status: "Active", expires: "2025-05-15", lastLogin: "2 hours ago", apiHits: "850K", dataVolume: "1.2 TB" },
  { id: "1003", name: "Global Traders", email: "sales@gt-hub.com", plan: "Starter", status: "Warning", expires: "2024-11-20", lastLogin: "5 days ago", apiHits: "12K", dataVolume: "50 GB" },
  { id: "1004", name: "Nova Supply Chain", email: "logistics@novasc.co", plan: "Enterprise", status: "Active", expires: "2026-08-30", lastLogin: "1 day ago", apiHits: "3.4M", dataVolume: "12 TB" },
  { id: "1005", name: "Zephyr E-Com", email: "support@zephyrecom.com", plan: "Pro", status: "Expired", expires: "2024-01-10", lastLogin: "3 months ago", apiHits: "0", dataVolume: "Locked" },
  { id: "1006", name: "Nexus Brands", email: "hello@nexusbrands.org", plan: "Starter", status: "Active", expires: "2025-09-05", lastLogin: "Just now", apiHits: "45K", dataVolume: "150 GB" },
];

const AdminPanel = ({ onLogout }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminTab, setAdminTab] = useState("hub");

  const tabStyle = {
    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
    borderRadius: 8, fontSize: 14, fontWeight: 700, border: "none",
    cursor: "pointer", transition: "all 0.2s", textAlign: "left"
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return MOCK_USERS;
    const q = searchQuery.toLowerCase();
    return MOCK_USERS.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) || 
      u.id.includes(q) ||
      u.plan.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const kpis = useMemo(() => {
    let activeNodes = 0;
    let dataProcessed = 0;
    let intimations = 0;
    
    filteredUsers.forEach(u => {
      if(u.status === "Active") activeNodes++;
      if(u.status === "Warning" || u.status === "Expired") intimations++;
      
      const v = parseFloat(u.dataVolume) || 0;
      if (u.dataVolume.includes("TB")) dataProcessed += v * 1024;
      else if (u.dataVolume.includes("GB")) dataProcessed += v;
    });
    
    return {
      nodes: activeNodes,
      volumes: dataProcessed > 1000 ? (dataProcessed/1024).toFixed(1) + " TB" : dataProcessed + " GB",
      intimations
    }
  }, [filteredUsers]);

  const handleSendIntimation = (u) => {
    setToast(`Intimation successfully dispatched to ${u.name} (${u.email}) via AWS SES.`);
    setTimeout(() => setToast(null), 3500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(34, 197, 94, 0.15)", color: "#16a34a", border: "1px solid rgba(34, 197, 94, 0.3)" }}>ACTIVE</span>;
      case "Warning":
        return <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(245, 158, 11, 0.15)", color: "#d97706", border: "1px solid rgba(245, 158, 11, 0.3)" }}>EXPIRING SOON</span>;
      case "Expired":
        return <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: 11, fontWeight: 800, background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", border: "1px solid rgba(239, 68, 68, 0.3)" }}>SUPERVISORY LOCK</span>;
      default:
        return null;
    }
  };

  const getPlanIcon = (plan) => {
    if (plan === "Enterprise") return <Shield size={14} color="#6366f1" style={{ marginRight: 6 }} />;
    if (plan === "Pro") return <CheckCircle size={14} color="#10b981" style={{ marginRight: 6 }} />;
    return <CreditCard size={14} color="#64748b" style={{ marginRight: 6 }} />;
  };

  return (
    <>
      <style>{`
        .admin-bg {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          padding: 40px 60px;
        }
        
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          background: #0f172a;
          padding: 32px 40px;
          border-radius: 20px;
          color: white;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 4px;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .table-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          overflow: hidden;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          text-align: left;
          padding: 16px;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          color: #64748b;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .admin-table td {
          padding: 18px 16px;
          font-size: 14px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .admin-table tr:hover {
          background: #f8fafc;
        }

        .user-name-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f172a;
          font-weight: 800;
          font-size: 15px;
          border: 1px solid #cbd5e1;
        }

        .btn-logout {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-logout:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .btn-warn {
          background: transparent;
          border: 1px solid #f59e0b;
          color: #d97706;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-warn:hover {
          background: #fef3c7;
        }
      `}</style>
      
      <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
        
        {/* SIDEBAR */}
        <div className="admin-sidebar" style={{ width: 280, background: "#0f172a", display: "flex", flexDirection: "column", padding: "32px 24px", color: "white", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <Shield size={32} color="#60a5fa" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              SellerIQ <span style={{ color: "#60a5fa" }}>Master</span>
            </h1>
          </div>
          
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 12, marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Clearance Level 4</div>
            <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.5 }}>
              Manage global client intelligence nodes, resource utilization, and subscription parameters.
            </p>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
            <button onClick={() => setAdminTab("hub")} style={{ ...tabStyle, background: adminTab === "hub" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: adminTab === "hub" ? "#60a5fa" : "#94a3b8" }}>
              <Activity size={18} /> Network Hub
            </button>
            <button onClick={() => setAdminTab("logs")} style={{ ...tabStyle, background: adminTab === "logs" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: adminTab === "logs" ? "#60a5fa" : "#94a3b8" }}>
              <Server size={18} /> System Logs
            </button>
            <button onClick={() => setAdminTab("billing")} style={{ ...tabStyle, background: adminTab === "billing" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: adminTab === "billing" ? "#60a5fa" : "#94a3b8" }}>
              <CreditCard size={18} /> Billing Engines
            </button>
            <button onClick={() => setAdminTab("settings")} style={{ ...tabStyle, background: adminTab === "settings" ? "rgba(59, 130, 246, 0.15)" : "transparent", color: adminTab === "settings" ? "#60a5fa" : "#94a3b8" }}>
              <Settings size={18} /> Global Settings
            </button>
          </nav>

          <div style={{ marginTop: "auto" }}>
            <button className="btn-logout" onClick={onLogout} style={{ width: "100%", justifyContent: "center" }}>
              <LogOut size={16} /> Terminate Session
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="admin-content" style={{ flex: 1, padding: "40px 60px", overflowY: "auto" }}>
          
          {adminTab === "hub" ? (
            <>
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>Network Hub Overview</h2>
                <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Monitor platform health and active telemetry limits.</div>
              </div>

              {/* Top KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 40 }}>
          <div className="stat-card">
             <div className="stat-icon" style={{ background: "#e0e7ff", color: "#4f46e5" }}><Users size={24} /></div>
             <div>
               <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: '0.05em' }}>Active Client Nodes</div>
               <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.nodes.toLocaleString()}</div>
             </div>
          </div>
          <div className="stat-card">
             <div className="stat-icon" style={{ background: "#dcfce7", color: "#16a34a" }}><Activity size={24} /></div>
             <div>
               <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: '0.05em' }}>Global API Hits (24h)</div>
               <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>14.2M</div>
             </div>
          </div>
          <div className="stat-card">
             <div className="stat-icon" style={{ background: "#f3e8ff", color: "#9333ea" }}><Database size={24} /></div>
             <div>
               <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: '0.05em' }}>Data Processed</div>
               <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.volumes}</div>
             </div>
          </div>
          <div className="stat-card">
             <div className="stat-icon" style={{ background: "#fee2e2", color: "#dc2626" }}><Bell size={24} /></div>
             <div>
               <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: '0.05em' }}>Required Intimations</div>
               <div style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", marginTop: 4 }}>{kpis.intimations}</div>
             </div>
          </div>
        </div>

        {/* Global User Table */}
        <div className="table-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: "#0f172a" }}>Client Directory & Operations</h2>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Monitor and manage individual user pipelines</div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "10px 16px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
               <Search size={16} color="#94a3b8" style={{ marginRight: 8 }} />
               <input 
                 type="text" 
                 placeholder="Search domains or IDs..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#334155", width: 250, fontWeight: 500 }} 
               />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Workspace User</th>
                <th>SaaS Plan Tier</th>
                <th>Resource Usage</th>
                <th>Latest Session</th>
                <th>Plan Expiry Date</th>
                <th>Node Status</th>
                <th style={{ textAlign: "right" }}>Intimations</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: 600 }}>No clients match your strict perimeter parameters.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">{u.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", fontWeight: 700 }}>
                      {getPlanIcon(u.plan)} {u.plan}
                    </div>
                  </td>
                  <td>
                     <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                       {u.apiHits} reqs <span style={{ color: "#cbd5e1", margin: "0 4px" }}>|</span> {u.dataVolume}
                     </div>
                  </td>
                  <td>
                     <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                       <Clock size={14} /> {u.lastLogin}
                     </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#334155" }}>
                      <Calendar size={14} color="#94a3b8" /> {u.expires}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(u.status)}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                      {u.status === "Warning" || u.status === "Expired" ? (
                        <button onClick={() => handleSendIntimation(u)} className="btn-warn">
                           <Mail size={14} /> Send Expiry Warning
                        </button>
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", display: "flex", alignItems: "center", padding: "6px 12px" }}>
                          No action needed
                        </div>
                      )}
                      
                      <button onClick={() => setSelectedUser(u)} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "6px 10px", borderRadius: 6, color: "#0f172a", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "inline-flex", alignItems: "center" }}>
                        Manage <ArrowUpRight size={14} style={{ marginLeft: 4 }} />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
          
              <div style={{ padding: "24px 0 0", textAlign: "center", color: "#64748b", fontSize: 13, fontWeight: 600 }}>
                 Showing {filteredUsers.length} registered remote entries
              </div>
            </div>
            </>
          ) : adminTab === "logs" ? (
             <SystemLogs />
          ) : adminTab === "billing" ? (
             <BillingEngines users={MOCK_USERS} />
          ) : adminTab === "settings" ? (
             <GlobalSettings />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
              <Server size={64} style={{ marginBottom: 24, opacity: 0.2 }} />
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "#475569", margin: "0 0 8px" }}>Module Initializing...</h2>
              <p style={{ margin: 0, fontSize: 15 }}>The <b>{adminTab}</b> module is currently being provisioned for your workspace.</p>
            </div>
          )}

        {/* Custom Toast Notification */}
        {toast && (
          <div style={{ 
            position: "fixed", bottom: 40, right: 40, 
            background: "#0f172a", color: "#f8fafc", 
            padding: "16px 24px", borderRadius: 8, 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            display: "flex", alignItems: "center", gap: 12, zIndex: 1000,
            animation: "fadeIn 0.3s ease-out" 
          }}>
             <CheckCircle size={20} color="#10b981" />
             <span style={{ fontSize: 14, fontWeight: 600 }}>{toast}</span>
          </div>
        )}

        {/* Side Drawer Modal */}
        {selectedUser && (
          <>
            <div 
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.3)", backdropFilter: "blur(4px)", zIndex: 998 }} 
              onClick={() => setSelectedUser(null)}
            />
            <div style={{ 
              position: "fixed", top: 0, right: 0, bottom: 0, width: 440, 
              background: "#ffffff", boxShadow: "-10px 0 30px rgba(0,0,0,0.1)", zIndex: 999,
              padding: 40, animation: "slideIn 0.3s ease-out", display: "flex", flexDirection: "column"
            }}>
               <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 8px", color: "#0f172a" }}>Client Telemetry</h2>
               <div style={{ fontSize: 13, color: "#64748b", marginBottom: 32 }}>Diagnostics & Control Panel for ID: {selectedUser.id}</div>
               
               <div style={{ background: "#f8fafc", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24 }}>
                 <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Primary Info</div>
                 <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{selectedUser.name}</div>
                 <div style={{ fontSize: 14, color: "#64748b", marginTop: 4 }}>{selectedUser.email}</div>
               </div>

               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                 <div style={{ border: "1px solid #e2e8f0", padding: 16, borderRadius: 8 }}>
                   <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800 }}>SAAS PLAN</div>
                   <div style={{ display: "flex", alignItems: "center", marginTop: 4, fontWeight: 700, fontSize: 14, color: "#334155" }}>
                     {getPlanIcon(selectedUser.plan)} {selectedUser.plan}
                   </div>
                 </div>
                 <div style={{ border: "1px solid #e2e8f0", padding: 16, borderRadius: 8 }}>
                   <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 800 }}>RESOURCE USAGE</div>
                   <div style={{ marginTop: 4, fontWeight: 700, fontSize: 14, color: "#334155" }}>{selectedUser.dataVolume}</div>
                 </div>
               </div>

               <button style={{ width: "100%", padding: 14, background: "#0f172a", color: "#ffffff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", marginTop: "auto" }} onClick={() => setSelectedUser(null)}>
                 Close Diagnostics 
               </button>
            </div>
          </>
        )}
        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `}</style>
        </div>
      </div>
    </>
  );
};

// ─── SUB-MODULES ────────────────────────────────────────────────────────────

const SystemLogs = () => {
  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>System Diagnostics Logs</h2>
        <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Real-time terminal output and structural health.</div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#64748b', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}><Cpu size={16} color="#3b82f6" /> Global CPU Load</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>24.8%</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#64748b', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}><HardDrive size={16} color="#10b981" /> Memory Cluster</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>1.2 TB <span style={{fontSize: 14, color: '#64748b'}}>/ 5.0 TB</span></div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#64748b', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}><Activity size={16} color="#8b5cf6" /> Current Latency</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>42ms</div>
        </div>
      </div>

      <div style={{ background: '#020617', borderRadius: 16, padding: 24, fontFamily: 'monospace', color: '#4ade80', fontSize: 13, height: 400, overflowY: 'auto', border: '1px solid #1e293b', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.5)' }}>
         <div style={{ color: '#fff', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 12 }}><TerminalSquare size={18} /> Terminal Node 1 Active</div>
         <div>[{new Date().toLocaleTimeString()}] INF - Server Engine Initialized on port 5000</div>
         <div>[{new Date().toLocaleTimeString()}] INF - PostgreSQL cluster bound successfully.</div>
         <div style={{ color: '#4ade80' }}>[{new Date().toLocaleTimeString()}] INF - Stable CPU trajectory predicted from Gateway 4.</div>
         <div>[{new Date().toLocaleTimeString()}] INF - Authenticated 1,492 root client nodes.</div>
         <div>[{new Date().toLocaleTimeString()}] INF - Routing metric pipeline ready.</div>
         <div style={{ color: '#4ade80' }}>[{new Date().toLocaleTimeString()}] INF - Verified Stripe API webhook resolution.</div>
         <div>[{new Date().toLocaleTimeString()}] INF - Recovered state successfully. Listening...</div>
      </div>
    </div>
  );
};

const BillingEngines = ({ users }) => {
  const mrr = useMemo(() => {
    return users.reduce((sum, u) => sum + (u.plan === 'Enterprise' ? 14999 : u.plan === 'Pro' ? 5999 : 2999), 0);
  }, [users]);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>Billing Operations</h2>
        <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Live subscription revenue parsing.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32, gridColumn: 'span 2', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#64748b', fontWeight: 800, fontSize: 12, textTransform: 'uppercase' }}><DollarSign size={16} color="#10b981" /> Active MRR</div>
           <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a' }}>₹{mrr.toLocaleString('en-IN')}</div>
           <div style={{ marginTop: 8, color: '#10b981', fontWeight: 700, display: 'flex', gap: 4, alignItems: 'center' }}><TrendingUp size={16} /> +12.4% over last month</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14 }}><span style={{color: '#64748b'}}>Enterprise</span> <span>{users.filter(u=>u.plan==='Enterprise').length} Active</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14 }}><span style={{color: '#64748b'}}>Pro</span> <span>{users.filter(u=>u.plan==='Pro').length} Active</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 14 }}><span style={{color: '#64748b'}}>Starter</span> <span>{users.filter(u=>u.plan==='Starter').length} Active</span></div>
        </div>
      </div>

      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Upcoming Renewals</h3>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
         {users.slice(0, 4).map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
               <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{u.plan} Tier Configuration</div>
               </div>
               <div style={{ fontWeight: 700, color: '#10b981' }}>{u.expires}</div>
            </div>
         ))}
      </div>
    </div>
  );
};

const GlobalSettings = () => {
  const [force2FA, setForce2FA] = useState(true);
  const [autoBan, setAutoBan] = useState(false);
  const [throttleConfigOpen, setThrottleConfigOpen] = useState(false);

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", margin: "0" }}>System Configuration</h2>
        <div style={{ color: "#64748b", fontSize: 15, marginTop: 4 }}>Master operational parameters and security toggles.</div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
         <div onClick={() => setForce2FA(!force2FA)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.1s' }}>
            <div>
               <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>Force 2-Factor Authentication</div>
               <div style={{ color: '#64748b', fontSize: 14 }}>Mandate biometric or token generation for all enterprise node log-ins.</div>
            </div>
            {force2FA ? <ToggleRight size={36} color="#10b981" /> : <ToggleLeft size={36} color="#cbd5e1" />}
         </div>
         <div onClick={() => setAutoBan(!autoBan)} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.1s' }}>
            <div>
               <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>Risk Auto-Ban Module</div>
               <div style={{ color: '#64748b', fontSize: 14 }}>Automatically disable workspace access for detected high-risk IP addresses.</div>
            </div>
            {autoBan ? <ToggleRight size={36} color="#10b981" /> : <ToggleLeft size={36} color="#cbd5e1" />}
         </div>
         <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 16, marginBottom: 4 }}>API Throttle Threshold</div>
                  <div style={{ color: '#64748b', fontSize: 14 }}>Restricts queries exceeding dynamic volume limits.</div>
               </div>
               <button 
                  onClick={() => setThrottleConfigOpen(!throttleConfigOpen)}
                  style={{ background: throttleConfigOpen ? '#0f172a' : '#f8fafc', border: throttleConfigOpen ? 'none' : '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 6, fontWeight: 700, color: throttleConfigOpen ? '#fff' : '#334155', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {throttleConfigOpen ? "Confirm Update" : "Configure"}
               </button>
            </div>
            
            {throttleConfigOpen && (
              <div style={{ animation: "fadeIn 0.2s ease-out", padding: '16px 20px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                 <div style={{ fontWeight: 700, color: '#475569', fontSize: 14 }}>Throttle Limit (req/sec):</div>
                 <input type="number" defaultValue={5000} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 700, width: 100, fontSize: 14, outline: 'none' }} />
                 <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>* Overriding limits requires Level 4 root authorization.</div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default AdminPanel;
