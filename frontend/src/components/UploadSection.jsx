import React, { useState, useCallback } from "react";
import { UploadCloud, Cpu, ShieldAlert, FileSpreadsheet, Lock, Activity, X, CheckCircle2, Plus, Layers, Trash2, AlertCircle } from "lucide-react";

const MAX_SIZES = { starter: 5, pro: 100, enterprise: 500 }; // MB

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const UploadSection = ({ onFileSelect, activePlan = "starter", usageStats, ingestionStatus }) => {
  const [drag, setDrag] = useState(false);
  const [fileQueue, setFileQueue] = useState([]); // [{file, id, error}]
  const loading = ingestionStatus?.loading || false;
  const msg = ingestionStatus?.msg || "";
  const progress = ingestionStatus?.progress || 0;

  const maxMB = MAX_SIZES[activePlan] || 5;
  const maxBytes = maxMB * 1024 * 1024;

  const addFiles = useCallback((newFiles) => {
    const entries = Array.from(newFiles).map((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;
      let error = null;
      if (!file.name.match(/\.(csv|xlsx|xls)$/i)) error = "Unsupported format (CSV/XLSX only)";
      else if (file.size > maxBytes) error = `Exceeds ${maxMB}MB plan limit`;
      return { file, id, error };
    });

    setFileQueue((prev) => {
      // Deduplicate by name+size so re-adding same file is ignored
      const existingKeys = new Set(prev.map((e) => `${e.file.name}-${e.file.size}`));
      const fresh = entries.filter((e) => !existingKeys.has(`${e.file.name}-${e.file.size}`));
      return [...prev, ...fresh];
    });
  }, [maxBytes, maxMB]);

  const removeFile = (id) => setFileQueue((prev) => prev.filter((e) => e.id !== id));
  const clearAll = () => setFileQueue([]);

  const validFiles = fileQueue.filter((e) => !e.error).map((e) => e.file);
  const hasErrors = fileQueue.some((e) => e.error);

  const handleSubmit = () => {
    if (validFiles.length === 0 || loading) return;
    onFileSelect(validFiles); // pass array
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  return (
    <>
      <style>{`
        .upload-bg {
          min-height: 100vh;
          background: radial-gradient(circle at 50% -20%, #1e1b4b 0%, #020617 50%, #020617 100%);
          font-family: 'Inter', sans-serif;
          color: #f8fafc;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .upload-header { text-align: center; max-width: 700px; margin-bottom: 40px; }
        .drop-zone {
          width: 100%; max-width: 860px;
          padding: 52px 40px;
          border-radius: 24px;
          background: rgba(15, 23, 42, 0.6);
          border: 2px dashed rgba(255,255,255,0.15);
          backdrop-filter: blur(12px);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
          position: relative;
        }
        .drop-zone:hover, .drop-zone.drag-active { border-color: rgba(99,102,241,0.5); background: rgba(30,41,59,0.8); }
        .drop-zone.drag-active { transform: scale(1.015); }
        .upload-icon-wrap {
          width: 72px; height: 72px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2));
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          border: 1px solid rgba(99,102,241,0.3);
          box-shadow: 0 0 30px rgba(99,102,241,0.2);
        }
        .upload-icon-wrap.pulsing { animation: pulseAnim 2s infinite; }
        @keyframes pulseAnim {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          70% { box-shadow: 0 0 0 20px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        .file-queue {
          width: 100%; max-width: 860px;
          margin-top: 24px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .file-row {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 14px 18px;
          transition: background 0.2s;
        }
        .file-row.has-error { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
        .file-row.valid { border-color: rgba(99,102,241,0.2); }
        .file-icon-wrap {
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .file-icon-wrap.ok { background: rgba(99,102,241,0.15); }
        .file-icon-wrap.err { background: rgba(239,68,68,0.15); }
        .file-name { font-size: 14px; font-weight: 600; color: #e2e8f0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-size { font-size: 12px; color: #64748b; flex-shrink: 0; }
        .file-err-label { font-size: 12px; color: #f87171; font-weight: 600; flex-shrink: 0; }
        .remove-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; width: 28px; height: 28px; display: flex;
          align-items: center; justify-content: center; cursor: pointer;
          flex-shrink: 0; color: #94a3b8; transition: all 0.2s;
        }
        .remove-btn:hover { background: rgba(239,68,68,0.15); color: #f87171; border-color: rgba(239,68,68,0.3); }
        .queue-actions { display: flex; gap: 12px; margin-top: 8px; width: 100%; max-width: 860px; }
        .add-more-btn {
          flex: 1; padding: 13px; border-radius: 14px;
          border: 1px dashed rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.05); color: #818cf8;
          font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .add-more-btn:hover { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.6); }
        .clear-btn {
          padding: 13px 20px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent; color: #64748b;
          font-size: 14px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .clear-btn:hover { border-color: rgba(239,68,68,0.3); color: #f87171; background: rgba(239,68,68,0.05); }
        .merge-summary {
          width: 100%; max-width: 860px; margin-top: 16px;
          background: rgba(16,185,129,0.08);
          border: 1px solid rgba(16,185,129,0.2);
          border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: center; gap: 14px;
        }
        .submit-btn {
          width: 100%; max-width: 860px; margin-top: 16px;
          padding: 18px; border-radius: 16px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff; font-size: 16px; font-weight: 800;
          cursor: pointer; transition: all 0.3s;
          box-shadow: 0 8px 24px rgba(99,102,241,0.35);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(99,102,241,0.45); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
        .progress-bar-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; margin-bottom: 10px; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7); transition: width 0.4s ease; }
        .feature-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; max-width: 860px; margin: 48px auto 0; opacity: 0.8;
        }
        .mini-feature { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #94a3b8; }
        .usage-badge {
          font-size: 12px; font-weight: 800; color: #f8fafc;
          padding: 6px 16px; background: rgba(255,255,255,0.03);
          border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2); backdrop-filter: blur(10px);
          margin-bottom: 32px;
        }
        @media (max-width: 768px) {
          .feature-grid { grid-template-columns: 1fr; }
          .queue-actions { flex-direction: column; }
        }
      `}</style>

      <div className="upload-bg">
        {/* Header */}
        <div className="upload-header">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            <Layers size={14} /> Multi-File Data Portal
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Upload &amp; Merge <span style={{ color: "#a855f7" }}>Datasets</span>
          </h1>
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.65, maxWidth: 580, margin: "0 auto" }}>
            Select one or multiple CSV/Excel files. The engine will automatically <strong style={{ color: "#e2e8f0" }}>merge, deduplicate</strong>, and run combined intelligence analysis across all uploads.
          </p>
        </div>

        {/* Usage badge */}
        <div className="usage-badge">
          {(() => {
            const planColors = { starter: "#10b981", pro: "#3b82f6", enterprise: "#f59e0b" };
            const pColor = planColors[activePlan?.toLowerCase()] || "#818cf8";
            const used = usageStats?.used || 0;
            const limit = usageStats?.limit || 3;
            return (
              <>
                <Activity size={13} color={pColor} />
                <span style={{ color: "#fff", fontSize: 13 }}>{used} <span style={{ color: "#64748b" }}>/</span> {limit}</span>
                <span style={{ color: "#94a3b8" }}>UPLOADS USED</span>
                <span style={{ padding: "2px 8px", background: pColor + "20", color: pColor, borderRadius: 8, fontSize: 10, letterSpacing: 1, border: `1px solid ${pColor}40` }}>{activePlan?.toUpperCase()}</span>
              </>
            );
          })()}
        </div>

        {/* Drop Zone */}
        {!loading && (
          <div
            className={`drop-zone ${drag ? "drag-active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById("multiFileInput").click()}
          >
            <div className="upload-icon-wrap">
              <UploadCloud size={32} color="#818cf8" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              {fileQueue.length > 0 ? "Drop More Files Here" : "Drag & Drop Files Here"}
            </h2>
            <p style={{ color: "#64748b", margin: 0, fontSize: 14 }}>
              Supports <strong style={{ color: "#94a3b8" }}>.CSV, .XLSX, .XLS</strong> up to <strong style={{ color: "#94a3b8" }}>{maxMB}MB</strong> per file &mdash; multiple files allowed
            </p>
            <div style={{ marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 13, fontWeight: 600 }}>
              <Plus size={16} /> Browse Files
            </div>
            <input
              id="multiFileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files.length) { addFiles(e.target.files); e.target.value = ""; } }}
            />
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ width: "100%", maxWidth: 860, marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, background: "rgba(15,23,42,0.6)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "20px 24px" }}>
              <div className="upload-icon-wrap pulsing" style={{ margin: 0, width: 52, height: 52, flexShrink: 0 }}>
                <Cpu size={24} color="#c084fc" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Processing {validFiles.length} file{validFiles.length !== 1 ? "s" : ""}…</div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#818cf8", fontWeight: 600 }}>
                  <span>{msg || "Merging datasets & deduplicating…"}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
            {progress === 100 && (
              <button onClick={() => (window.location.hash = "overview")} style={{ width: "100%", padding: "14px", background: "white", color: "#6366f1", borderRadius: 12, fontWeight: 800, border: "none", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.2)", fontSize: 15 }}>
                🚀 Launch Dynamic Dashboard
              </button>
            )}
          </div>
        )}

        {/* File Queue */}
        {fileQueue.length > 0 && !loading && (
          <>
            <div className="file-queue">
              {fileQueue.map(({ file, id, error }) => (
                <div key={id} className={`file-row ${error ? "has-error" : "valid"}`}>
                  <div className={`file-icon-wrap ${error ? "err" : "ok"}`}>
                    {error ? <AlertCircle size={20} color="#f87171" /> : <FileSpreadsheet size={20} color="#818cf8" />}
                  </div>
                  <span className="file-name" title={file.name}>{file.name}</span>
                  <span className="file-size">{formatSize(file.size)}</span>
                  {error ? (
                    <span className="file-err-label">⚠ {error}</span>
                  ) : (
                    <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
                  )}
                  <button className="remove-btn" onClick={() => removeFile(id)} title="Remove">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Action row */}
            <div className="queue-actions">
              <button className="add-more-btn" onClick={() => document.getElementById("multiFileInput").click()}>
                <Plus size={16} /> Add More Files
              </button>
              <button className="clear-btn" onClick={clearAll}>
                <Trash2 size={14} /> Clear All
              </button>
            </div>

            {/* Merge summary */}
            {validFiles.length > 1 && (
              <div className="merge-summary">
                <Layers size={22} color="#10b981" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#34d399", marginBottom: 2 }}>
                    {validFiles.length} files will be merged &amp; deduplicated
                  </div>
                  <div style={{ fontSize: 12, color: "#6ee7b7" }}>
                    Total size: {formatSize(validFiles.reduce((s, f) => s + f.size, 0))} &bull; Duplicate rows with identical Order IDs will be removed automatically
                  </div>
                </div>
              </div>
            )}

            {hasErrors && (
              <div style={{ width: "100%", maxWidth: 860, marginTop: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 18px", fontSize: 13, color: "#fca5a5" }}>
                ⚠ Files with errors will be skipped. Fix or remove them before uploading.
              </div>
            )}

            {/* Submit */}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={validFiles.length === 0 || loading}
            >
              <Cpu size={20} />
              Analyze {validFiles.length} File{validFiles.length !== 1 ? "s" : ""} →
            </button>
          </>
        )}

        {/* Error message from parent */}
        {msg && msg !== "Success" && !loading && (
          <div style={{ color: "#ef4444", marginTop: 24, padding: "12px 24px", background: "rgba(239,68,68,0.1)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)" }}>
            {msg}
          </div>
        )}

        {/* Feature row */}
        <div className="feature-grid">
          <div className="mini-feature"><ShieldAlert size={18} color="#6366f1" /><span>End-to-End Encryption active.</span></div>
          <div className="mini-feature"><FileSpreadsheet size={18} color="#a855f7" /><span>Automatic schema normalization.</span></div>
          <div className="mini-feature"><Lock size={18} color="#10b981" /><span>Duplicate rows auto-removed.</span></div>
        </div>
      </div>
    </>
  );
};

export default UploadSection;
