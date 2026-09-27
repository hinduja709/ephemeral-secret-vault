import React, { useState, useEffect } from 'react';
import { Activity, Flame, ShieldCheck, Eye, RefreshCw, X } from 'lucide-react';

export default function StatsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
      const interval = setInterval(fetchStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(7, 10, 17, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div className="glass-card-glow" style={{
        width: '100%',
        maxWidth: '550px',
        padding: '2rem',
        borderRadius: '24px',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '8px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Activity size={24} color="var(--accent-cyan)" />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            Live Vault Telemetry
          </h3>
        </div>

        {loading && !stats ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading real-time stats...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            
            <div style={{ background: 'rgba(13, 19, 34, 0.8)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <ShieldCheck size={16} />
                <span>ACTIVE SECRETS</span>
              </div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-cyan)' }}>
                {stats?.activeSecrets || 0}
              </p>
            </div>

            <div style={{ background: 'rgba(13, 19, 34, 0.8)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--accent-crimson)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-crimson)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Flame size={16} />
                <span>INCINERATED</span>
              </div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--accent-crimson)' }}>
                {stats?.totalBurned || 0}
              </p>
            </div>

            <div style={{ background: 'rgba(13, 19, 34, 0.8)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Eye size={16} />
                <span>VIEWS REVEALED</span>
              </div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {stats?.totalViewsFulfilled || 0}
              </p>
            </div>

            <div style={{ background: 'rgba(13, 19, 34, 0.8)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>
                <Activity size={16} />
                <span>TOTAL CREATED</span>
              </div>
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, marginTop: '0.2rem' }}>
                {stats?.totalCreated || 0}
              </p>
            </div>

          </div>
        )}

        <div style={{ textAlign: 'right' }}>
          <button onClick={fetchStats} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
}
