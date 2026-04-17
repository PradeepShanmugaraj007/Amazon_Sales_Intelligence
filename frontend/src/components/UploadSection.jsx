import React, { useState } from "react";
import { analyzeReport } from "../api";
import { UploadCloud, Cpu, ShieldAlert, FileSpreadsheet, Lock, Box, ShoppingCart, Database, CheckCircle2, Activity } from "lucide-react";

const UploadSection = ({ onData, activePlan = 'starter' }) => {
  // Track monthly upload count in localStorage
  const getUploadKey = () => {
    const now = new Date();
    return `selleriq_uploads_${activePlan}_${now.getFullYear()}_${now.getMonth() + 1}`;
  };
  const getUploadCount = () => parseInt(localStorage.getItem(getUploadKey()) || '0', 10);
  const incrementUploadCount = () => {
    const key = getUploadKey();
    localStorage.setItem(key, String(getUploadCount() + 1));
  };

  const PLAN_LIMITS = { starter: 9999, pro: 9999, enterprise: 9999 };
  const fileLimit = PLAN_LIMITS[activePlan] ?? 9999;
  const currentUploads = getUploadCount();

  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [migrationStatus, setMigrationStatus] = useState(0); // For progress bar
  const [source, setSource] = useState('amazon'); // 'amazon', 'shopify', 'custom'

  const handleFile = async (file) => {
    if (!file) return;

    // Enforce Monthly upload limit
    if (currentUploads >= fileLimit) {
      setMsg(`⚠️ Monthly upload limit reached for ${activePlan.toUpperCase()} plan (${fileLimit} files). Please upgrade your subscription for additional capacity.`);
      return;
    }

    // Enforce Plan-Based File Limits
    const MAX_SIZE = activePlan === 'starter' ? 1 * 1024 * 1024 : 50 * 1024 * 1024; // 1MB for Starter, 50MB for others
    if (file.size > MAX_SIZE) {
      if (activePlan === 'starter') {
        setMsg(`⚠️ Trial limit exceeded (1MB). Please upgrade to Pro for files up to 50MB.`);
      } else {
        setMsg(`⚠️ Upload limit exceeded (50MB). For larger enterprise migrations, please use the API Integration Hub.`);
      }
      return;
    }

    setLoading(true); 
    setMsg("Authenticating data source...");
    setMigrationStatus(15);
    
    setTimeout(() => {
        if(loading) setMigrationStatus(45);
    }, 400);

    let hasError = false;
    try {
      const result = await analyzeReport(file);
      
      if (result.success) {
        setMigrationStatus(100);
        setMsg("Migration complete. Finalizing workspace...");
        incrementUploadCount(); // count successful upload
        // Re-hydrate Date objects after JSON serialization
        if (result.rawData) {
          result.rawData.forEach(r => {
            if (r._isoDate) r._isoDate = new Date(r._isoDate);
          });
        }
        setTimeout(() => onData(result, file.name, source), 800); 
      }
    } catch (err) { 
      setMsg("Migration failed: " + err.message); 
      setMigrationStatus(0);
      hasError = true;
    } finally {
      if(hasError) setLoading(false); 
    }
  };

  return (
    <>
      <style>{`
        .upload-bg {
          min-height: 100vh;
          background: radial-gradient(circle at 50% -20%, #1e1b4b 0%, #020617 50%, #020617 100%);
          font-family: 'Inter', sans-serif;
          color: #f8fafc;
          padding: 80px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header-content {
          text-align: center;
          max-width: 700px;
          margin-bottom: 56px;
        }

        .migration-sources {
          display: flex;
          justify-content: center;
          gap: 20px;
          width: 100%;
          max-width: 900px;
          margin-bottom: 48px;
        }

        .source-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 360px;
        }
        
        .source-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }

        .source-card.active {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
          box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.3);
        }

        .source-card.active::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: #6366f1;
        }

        .source-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #94a3b8;
          transition: color 0.3s;
        }

        .source-card.active .source-icon {
          color: #818cf8;
          background: rgba(99, 102, 241, 0.2);
        }

        .drop-zone {
          width: 100%;
          max-width: 900px;
          padding: 80px 40px;
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.6);
          border: 2px dashed rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
        }

        .drop-zone:hover, .drop-zone.active {
          border-color: rgba(99, 102, 241, 0.5);
          background: rgba(30, 41, 59, 0.8);
        }
        
        .drop-zone.active {
          transform: scale(1.02);
        }

        .upload-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.2);
        }

        .progress-container {
          max-width: 500px;
          margin: 40px auto 0;
        }

        .progress-bar-bg {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          transition: width 0.4s ease;
        }

        .pulse {
          animation: pulseAnim 2s infinite;
        }

        @keyframes pulseAnim {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 900px;
          margin: 60px auto 0;
          opacity: 0.8;
        }

        .mini-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #94a3b8;
        }

        @media (max-width: 768px) {
          .migration-sources, .feature-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="upload-bg">
        
        <div className="header-content">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
            <Activity size={14} /> Workspace Initialization
          </div>
          <h1 style={{ fontSize: 42, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Data Migration <span style={{ color: "#a855f7" }}>Portal</span>
          </h1>
          <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.6, maxWidth: 640, margin: "0 auto" }}>
            Securely upload your bulk Amazon MTR data exports to instantiate the pipeline. Our proprietary intelligence engine will automatically:
          </p>
          <div style={{ display: 'inline-flex', flexDirection: 'column', textAlign: 'left', marginTop: 24, gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px 32px', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e2e8f0', fontSize: 15 }}>
              <Box size={20} color="#818cf8" />
              <span>Normalize raw schemas for rich <b>B2B & B2C analytics</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e2e8f0', fontSize: 15 }}>
              <ShieldAlert size={20} color="#f43f5e" />
              <span>Isolate critical <b>threat intelligence & fraud vectors</b></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#e2e8f0', fontSize: 15 }}>
              <Activity size={20} color="#10b981" />
              <span>Map <b>state-level revenue</b> and velocity trends</span>
            </div>
          </div>
        </div>



        <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          {(() => {
            const planColors = { starter: '#10b981', pro: '#3b82f6', enterprise: '#f59e0b' };
            const pColor = planColors[activePlan] || '#818cf8';
            return (
              <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', padding: '6px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', backdropFilter: 'blur(10px)' }}>
                <Activity size={14} color={pColor} /> 
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 13 }}>{currentUploads} <span style={{ color: '#64748b' }}>/</span> {fileLimit}</span> 
                  <span style={{ color: '#94a3b8', margin: '0 8px' }}>UPLOADS USED</span> 
                  <span style={{ padding: '2px 8px', background: pColor + '20', color: pColor, borderRadius: 8, fontSize: 10, letterSpacing: 1, border: `1px solid ${pColor}40` }}>{activePlan.toUpperCase()}</span>
                </span>
              </div>
            );
          })()}
        </div>

        <div 
          className={`drop-zone ${drag ? 'active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => !loading && document.getElementById("fileInput").click()}
        >
          <div className={`upload-icon-wrapper ${loading ? 'pulse' : ''}`}>
             {loading ? <Cpu size={36} color="#c084fc" /> : <UploadCloud size={36} color="#818cf8" />}
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            {loading ? "Migrating Data..." : "Drag & Drop Data Package"}
          </h2>
          <p style={{ color: "#64748b", margin: 0 }}>
            {loading 
              ? "Please wait while we normalize and scrub your dataset." 
              : `Or click anywhere in this zone to browse your files. Supports .CSV formats up to ${activePlan === 'starter' ? '1MB' : '50MB'} (${activePlan.toUpperCase()} Plan).`}
          </p>

          {loading && (
            <div className="progress-container">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${migrationStatus}%` }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#818cf8", fontWeight: 600 }}>
                <span>{msg}</span>
                <span>{migrationStatus}%</span>
              </div>
            </div>
          )}
          
          <input id="fileInput" type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>

        {msg && !loading && (
          <div style={{ color: "#ef4444", marginTop: 24, padding: "12px 24px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            {msg}
          </div>
        )}

        <div className="feature-grid">
           <div className="mini-feature"><ShieldAlert size={20} color="#6366f1" /><span>End-to-End Encryption protocol active.</span></div>
           <div className="mini-feature"><FileSpreadsheet size={20} color="#a855f7" /><span>Automated schema normalization.</span></div>
           <div className="mini-feature"><Lock size={20} color="#10b981" /><span>Enterprise SOC-2 compliance enforced.</span></div>
        </div>

      </div>
    </>
  );
};

export default UploadSection;
