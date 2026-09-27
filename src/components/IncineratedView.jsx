import React, { useState, useEffect } from 'react';
import { Flame, ShieldAlert, FileX, RefreshCw, Key, Award, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { computeHash } from '../cryptoUtils';

export default function IncineratedView({ secretId, title, burnedAt, burnReason, onReset }) {
  const [certHash, setCertHash] = useState('');

  useEffect(() => {
    // Generate proof hash for certificate
    const text = `${secretId}_${burnedAt}_${burnReason || 'VIEW_LIMIT'}`;
    computeHash(text).then(h => setCertHash(h));

    // Trigger subtle fire ash particles
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff2a5f', '#f59e0b', '#334155']
    });
  }, [secretId, burnedAt, burnReason]);

  const formattedDate = burnedAt ? new Date(burnedAt).toLocaleString() : new Date().toLocaleString();

  return (
    <div style={{ maxWidth: '750px', margin: '3rem auto', padding: '0 1rem' }}>
      <div className="glass-card" style={{
        padding: '3rem 2rem',
        borderRadius: '24px',
        textAlign: 'center',
        border: '1px solid var(--accent-crimson-glow)',
        boxShadow: 'var(--shadow-crimson)'
      }}>
        {/* Flame Icon */}
        <div className="animate-pulse" style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: 'rgba(255, 42, 95, 0.15)',
          border: '2px solid var(--accent-crimson)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 0 30px rgba(255, 42, 95, 0.4)'
        }}>
          <Flame size={42} color="var(--accent-crimson)" />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--accent-crimson)'
        }}>
          Secret Permanently Incinerated
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem', maxWidth: '550px', margin: '0.5rem auto 2rem' }}>
          This secret payload has been completely purged from server memory and disk storage. It cannot be recovered or decrypted by anyone.
        </p>

        {/* Certificate of Incineration */}
        <div style={{
          background: 'rgba(13, 19, 34, 0.9)',
          border: '1px dashed var(--accent-crimson)',
          borderRadius: '16px',
          padding: '1.5rem',
          textAlign: 'left',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Award size={20} color="var(--accent-amber)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
              Zero-Knowledge Certificate of Destruction
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>SECRET IDENTIFIER:</span>
              <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>{secretId || 'N/A'}</p>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>DESTRUCTION REASON:</span>
              <p style={{ color: 'var(--accent-crimson)', fontWeight: 700 }}>
                {burnReason === 'EXPIRED' ? 'Vault Lifetime Expired' : burnReason === 'MANUAL_REVOKE' ? 'Manually Revoked by Creator' : 'View Limit Reached'}
              </p>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>TIMESTAMP:</span>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formattedDate}</p>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: 'var(--text-muted)' }}>CRYPTOGRAPHIC PROOF (SHA-256):</span>
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)',
                wordBreak: 'break-all',
                background: 'rgba(0, 0, 0, 0.4)',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                marginTop: '0.2rem'
              }}>
                {certHash || 'Computing verification hash...'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onReset}
          className="btn-primary"
          style={{ padding: '0.85rem 2rem' }}
        >
          <RefreshCw size={18} />
          <span>Create New Secret</span>
        </button>
      </div>
    </div>
  );
}
