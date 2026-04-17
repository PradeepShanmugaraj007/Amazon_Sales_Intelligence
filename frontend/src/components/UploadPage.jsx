import React, { useState } from 'react';
import { uploadFile } from '../api';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a Valid CSV file.");
      }
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const startUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadFile(file, (p) => setProgress(p));
      onUploadSuccess(result, file.name);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Please check your CSV format.");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '100px auto', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Ingest Your Data</h1>
        <p style={{ color: '#64748b' }}>Upload your Amazon MTR, Shopify, or ERP sales report for instant intelligence.</p>
      </div>

      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragActive ? '#4f46e5' : '#e2e8f0'}`,
          borderRadius: 24,
          padding: 60,
          textAlign: 'center',
          background: dragActive ? '#f5f3ff' : '#ffffff',
          transition: 'all 0.3s ease',
          position: 'relative',
          cursor: 'pointer'
        }}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input id="file-upload" type="file" style={{ display: 'none' }} onChange={handleChange} accept=".csv" />
        
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Loader2 size={48} className="animate-spin" color="#4f46e5" />
            <div style={{ width: '100%', maxWidth: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                <span>Analyzing Dataset...</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#4f46e5', width: `${progress}%`, transition: 'width 0.3s' }}></div>
              </div>
            </div>
          </div>
        ) : file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, background: '#ecfdf5', color: '#10b981', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={32} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{file.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 64, height: 64, background: '#f5f3ff', color: '#4f46e5', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={32} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Drag & drop your report here</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>or click to browse from files</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 24, padding: 16, background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {file && !uploading && (
        <button 
          onClick={(e) => { e.stopPropagation(); startUpload(); }}
          style={{
            width: '100%', marginTop: 24, padding: '16px', borderRadius: 16, border: 'none',
            background: '#4f46e5', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(79,70,229,0.3)', transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Begin Multi-Core Analysis
        </button>
      )}
    </div>
  );
}
