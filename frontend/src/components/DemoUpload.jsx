import React, { useState } from "react";
import { analyzeReport } from "../api";
import { UploadCloud, Cpu, Activity, Play } from "lucide-react";

const DemoUpload = ({ onFileSelect, ingestionStatus }) => {
  const [drag, setDrag] = useState(false);
  const loading = ingestionStatus?.loading || false;
  const msg = ingestionStatus?.msg || "";
  const migrationStatus = ingestionStatus?.progress || 0;

  const handleFileLocal = async (file) => {
    if (!file || loading) return;

    // Demo enforces 5MB limit unconditionally
    if (file.size > 5 * 1024 * 1024) {
      alert(`Demo Trial limit exceeded (5MB). Subscription required for larger datasets.`);
      return;
    }

    // Reset input so same file can be selected twice if needed
    try { if (document.getElementById("demoFileInput")) document.getElementById("demoFileInput").value = ""; } catch(e) {}
    
    onFileSelect(file);
  };

  return (
    <>
      <style>{`
        .demo-upload-bg {
          min-height: 100vh;
          background: #0f172a;
          background-image: radial-gradient(circle at top right, rgba(99,102,241,0.1), transparent 400px),
                            radial-gradient(circle at bottom left, rgba(168,85,247,0.1), transparent 400px);
          font-family: 'Inter', sans-serif;
          color: #f8fafc;
          padding: 80px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .demo-drop-zone {
          width: 100%;
          max-width: 600px;
          padding: 60px 40px;
          border-radius: 24px;
          background: rgba(30, 41, 59, 0.4);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }

        .demo-drop-zone:hover, .demo-drop-zone.active {
          border-color: rgba(99, 102, 241, 0.6);
          background: rgba(30, 41, 59, 0.8);
        }

        .demo-progress-bar-bg {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          overflow: hidden;
          margin-top: 24px;
          margin-bottom: 8px;
        }

        .demo-progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          transition: width 0.4s ease;
        }
      `}</style>

      <div className="demo-upload-bg">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 20, background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: 13, fontWeight: 800, marginBottom: 24, border: "1px solid rgba(99,102,241,0.3)" }}>
            <Play size={14} fill="currentColor" /> INTERACTIVE DEMO MODE
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>Experience the Engine</h1>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Upload a sample file to see a live preview. Limited to 5MB (1 Month Duration).</p>
        </div>

        <div 
          className={`demo-drop-zone ${drag ? 'active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFileLocal(e.dataTransfer.files[0]); }}
          onClick={() => !loading && document.getElementById("demoFileInput").click()}
        >
          <div style={{ 
            width: 72, height: 72, margin: '0 auto 24px', borderRadius: '50%', 
            background: loading ? 'rgba(168,85,247,0.1)' : 'rgba(99,102,241,0.1)', 
            border: `1px solid ${loading ? 'rgba(168,85,247,0.3)' : 'rgba(99,102,241,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             {loading ? <Cpu size={32} color="#c084fc" className="pulse-anim" /> : <UploadCloud size={32} color="#818cf8" />}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {loading ? "Processing Sample..." : "Drop Demo Data"}
          </h2>
          <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
            {loading ? "Simulating fraud detection and generating forecasts." : "Click or drag your 1MB valid CSV sample."}
          </p>

          {loading && (
            <div style={{ textAlign: 'left' }}>
              <div className="demo-progress-bar-bg">
                <div className="demo-progress-bar-fill" style={{ width: `${migrationStatus}%` }}></div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#a855f7", fontWeight: 700, marginBottom: 12 }}>
                <span>{msg}</span>
                <span>{migrationStatus}%</span>
              </div>

              {migrationStatus === 100 && (
                <button 
                  onClick={() => {
                    setLoading(false);
                    onData(null, '', ''); // Fallback trigger
                  }}
                  style={{ 
                    marginTop: 10, width: '100%', padding: '12px', background: 'white', 
                    color: '#6366f1', borderRadius: 12, fontWeight: 800, border: 'none', 
                    cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                    animation: 'fadeIn 0.3s ease-out'
                  }}
                >
                  🚀 Launch Dynamic Dashboard
                </button>
              )}
            </div>
          )}
          
          <input id="demoFileInput" type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFileLocal(e.target.files[0])} />
        </div>

        {msg && !loading && (
          <div style={{ color: "#ef4444", marginTop: 24, padding: "12px 24px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            {msg}
          </div>
        )}
        
        <div style={{ marginTop: 40, display: 'flex', gap: 24, color: '#475569', fontSize: 13, fontWeight: 600 }}>
           <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={16}/> Discarded after 15m</span>
           <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Cpu size={16}/> Max 1MB</span>
        </div>
      </div>
    </>
  );
};

export default DemoUpload;
