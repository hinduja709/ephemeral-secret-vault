import React, { useState, useEffect } from 'react';
import { History, Copy, Check, Flame, ExternalLink, RefreshCw, Trash2, Clock, Eye, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function SecretHistory({ onSelectSecret }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    const local = JSON.parse(localStorage.getItem('vault_history') || '[]');
    
    // Check live metadata for each secret
    const updated = await Promise.all(local.map(async (item) => {
      try {
        const res = await fetch(`/api/secrets/${item.id}/meta`);
        if (!res.ok) {
          return { ...item, isBurned: true, burnReason: 'EXPIRED_OR_VIEWED' };
        }
        const meta = await res.json();
        return {
          ...item,
          isBurned: meta.isBurned,
          burnReason: meta.burnReason,
          viewsRemaining: meta.viewsRemaining,
          expiresAt: meta.expiresAt
        };
      } catch (e) {
        return item;
      }
    }));

    setHistoryItems(updated);
    localStorage.setItem('vault_history', JSON.stringify(updated));
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCopyLink = (shareUrl, id) => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRevoke = async (id, revokeKey) => {
    if (!confirm('Incinerate this secret immediately? Intended recipient will no longer be able to reveal it.')) return;
    try {
      const res = await fetch(`/api/secrets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-revoke-key': revokeKey
        },
        body: JSON.stringify({ revokeKey })
      });
      if (res.ok) {
        loadHistory();
      } else {
        alert('Failed to revoke secret');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = () => {
    if (confirm('Clear local history log? (Secrets in vault will not be affected unless incinerated).')) {
      localStorage.removeItem('vault_history');
      setHistoryItems([]);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="glass-card" style={{ padding: '2rem', borderRadius: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <History color="var(--accent-cyan)" size={24} />
              <span>Vault Log & Activity</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Local history of secrets you have created. Note: Decryption keys are stored only in share URLs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={loadHistory} className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Status</span>
            </button>
            {historyItems.length > 0 && (
              <button onClick={clearHistory} className="btn-secondary" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', color: 'var(--accent-crimson)' }}>
                <Trash2 size={14} />
                <span>Clear Log</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Secrets */}
        {historyItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(13, 19, 34, 0.4)', borderRadius: '16px', border: '1px dashed var(--border-subtle)' }}>
            <ShieldCheck size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>No Created Secrets Logged</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Secret links created in this browser session will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {historyItems.map((item) => {
              const isExpired = Date.now() > item.expiresAt;
              const isBurned = item.isBurned || isExpired;

              return (
                <div key={item.id} style={{
                  background: 'rgba(13, 19, 34, 0.8)',
                  border: isBurned ? '1px solid var(--border-subtle)' : '1px solid var(--border-cyan)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  opacity: isBurned ? 0.7 : 1,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <span className={`badge ${isBurned ? 'badge-crimson' : 'badge-emerald'}`}>
                        {isBurned ? 'INCINERATED' : 'ACTIVE IN VAULT'}
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700 }}>
                        {item.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} />
                        {isBurned ? 'Expired' : `Expires: ${new Date(item.expiresAt).toLocaleTimeString()}`}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={13} />
                        Max Views: {item.maxViews}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {!isBurned && (
                      <>
                        <button
                          onClick={() => handleCopyLink(item.shareUrl, item.id)}
                          className="btn-secondary"
                          style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                        >
                          {copiedId === item.id ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedId === item.id ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <button
                          onClick={() => handleRevoke(item.id, item.revokeKey)}
                          className="btn-danger"
                          style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                        >
                          <Flame size={14} />
                          <span>Burn Now</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
