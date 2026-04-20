import React, { useState, useEffect } from 'react';
import { checkHealth } from '../api';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function BackendStatus() {
  const [status, setStatus] = useState('checking'); // checking, online, offline
  const [lastChecked, setLastChecked] = useState(null);

  const verifyStatus = async () => {
    setStatus('checking');
    try {
      const data = await checkHealth();
      if (data && data.status === 'ok') {
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (err) {
      setStatus('offline');
    }
    setLastChecked(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    verifyStatus();
    const interval = setInterval(verifyStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      padding: '12px 20px',
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#94a3b8',
      width: 'fit-content',
      margin: '0 auto 20px auto'
    }}>
      {status === 'checking' && (
        <>
          <RefreshCw size={16} className="animate-spin" color="#3b82f6" />
          <span>Verifying neural connection...</span>
        </>
      )}
      {status === 'online' && (
        <>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ color: '#f8fafc' }}>Backend Online</span>
          <span style={{ opacity: 0.5, fontSize: '11px' }}>Synced at {lastChecked}</span>
        </>
      )}
      {status === 'offline' && (
        <>
          <WifiOff size={16} color="#ef4444" />
          <span style={{ color: '#f87171' }}>Network Error: Backend Unreachable</span>
          <button 
            onClick={verifyStatus}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#ef4444', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '11px', fontWeight: '800'
            }}
          >
            RETRY
          </button>
        </>
      )}
    </div>
  );
}
