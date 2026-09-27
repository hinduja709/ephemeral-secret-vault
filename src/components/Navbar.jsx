import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Lock, History, HelpCircle, Activity, KeyRound, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenStats }) {
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/stats');
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
    const interval = setInterval(checkServer, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 10, 17, 0.85)',
      backdropFilter: 'blur(12px)',
      sticky: 'top',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('create')} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2) 0%, rgba(79, 172, 254, 0.1) 100%)',
            border: '1px solid var(--border-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Lock size={22} color="var(--accent-cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #ffffff 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Ephemeral Vault
              </h1>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                AES-256
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Zero-Knowledge Self-Destructing Secrets
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('create')}
            className={activeTab === 'create' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
          >
            <KeyRound size={16} />
            <span>Create Secret</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
          >
            <History size={16} />
            <span>Vault Log</span>
          </button>

          <button
            onClick={() => setActiveTab('how-it-works')}
            className={activeTab === 'how-it-works' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}
          >
            <HelpCircle size={16} />
            <span>Security Spec</span>
          </button>

          <button
            onClick={onOpenStats}
            className="btn-secondary"
            style={{ padding: '0.55rem 0.9rem', fontSize: '0.88rem' }}
            title="View Live Vault Telemetry"
          >
            <Activity size={16} color="var(--accent-cyan)" />
          </button>
        </nav>

        {/* Server Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: serverStatus === 'online' ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
            boxShadow: serverStatus === 'online' ? '0 0 10px var(--accent-emerald)' : '0 0 10px var(--accent-crimson)'
          }} />
          <span style={{ color: 'var(--text-muted)' }}>
            {serverStatus === 'online' ? 'Vault Node Active' : 'Connecting...'}
          </span>
        </div>
      </div>
    </header>
  );
}
