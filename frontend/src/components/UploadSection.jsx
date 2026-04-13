import React, { useState } from "react";
import { analyzeReport } from "../api";
import { UploadCloud, Cpu, ShieldAlert, FileSpreadsheet, Lock, Box, ShoppingCart, Database, CheckCircle2, Activity } from "lucide-react";

const UploadSection = ({ onData }) => {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [migrationStatus, setMigrationStatus] = useState(0); // For progress bar
  const [source, setSource] = useState('amazon'); // 'amazon', 'shopify', 'custom'

  const handleFile = async (file) => {
    if (!file) return;
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

  const MIGRATION_PLANS = [
    { id: 'amazon', name: 'Amazon MTR', icon: <Box size={24} />, desc: 'Native integration for B2B/B2C analytics.' },
    { id: 'shopify', name: 'Shopify Export', icon: <ShoppingCart size={24} />, desc: 'Standardize direct-to-consumer data.' },
    { id: 'custom', name: 'Custom ERP', icon: <Database size={24} />, desc: 'Map your own normalized CSV sheets.' }
  ];

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
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.6 }}>
            Select your migration plan and securely upload your bulk data exports to instantiate the analytics engine.
          </p>
        </div>

        <div className="migration-sources" style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
          {MIGRATION_PLANS.map(plan => (
            <div 
              key={plan.id} 
              className={`source-card ${source === plan.id ? 'active' : ''}`}
              onClick={() => setSource(plan.id)}
            >
              {source === plan.id && <CheckCircle2 size={20} color="#818cf8" style={{ position: 'absolute', top: 20, right: 20 }} />}
              <div className="source-icon">{plan.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>{plan.name}</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{plan.desc}</p>
            </div>
          ))}
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
            {loading ? "Please wait while we normalize and scrub your dataset." : "Or click anywhere in this zone to browse your files. Supports .CSV formats up to 50MB."}
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
          {source === 'amazon' && (
            <>
              <div className="mini-feature"><ShieldAlert size={20} color="#6366f1" /><span>End-to-End Encryption protocol active.</span></div>
              <div className="mini-feature"><FileSpreadsheet size={20} color="#a855f7" /><span>Automated schema normalization.</span></div>
              <div className="mini-feature"><Lock size={20} color="#10b981" /><span>Enterprise SOC-2 compliance enforced.</span></div>
            </>
          )}
          {source === 'shopify' && (
            <>
              <div className="mini-feature"><ShoppingCart size={20} color="#6366f1" /><span>Direct-to-Consumer flow analysis.</span></div>
              <div className="mini-feature"><Activity size={20} color="#a855f7" /><span>Cart abandonment & checkout optimization.</span></div>
              <div className="mini-feature"><Database size={20} color="#10b981" /><span>Customer lifetime value tracking active.</span></div>
            </>
          )}
          {source === 'custom' && (
            <>
              <div className="mini-feature"><Database size={20} color="#6366f1" /><span>Dynamic manual schema mapping engine.</span></div>
              <div className="mini-feature"><Box size={20} color="#a855f7" /><span>Wholesale volume & supply chain tracking.</span></div>
              <div className="mini-feature"><Lock size={20} color="#10b981" /><span>Secure on-premise dataset containerization.</span></div>
            </>
          )}
        </div>

      </div>
    </>
  );
};

export default UploadSection;
