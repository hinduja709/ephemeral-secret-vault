import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  Copy, 
  Check, 
  QrCode, 
  Flame, 
  ShieldAlert, 
  ExternalLink, 
  Clock, 
  Eye, 
  ArrowLeft,
  Share2
} from 'lucide-react';
import QRCode from 'qrcode';

export default function SecretCreatedModal({ secretData, onClose, onRevoke }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const qrCanvasRef = useRef(null);

  const { id, title, shareUrl, revokeKey, expiresAt, maxViews } = secretData;

  useEffect(() => {
    if (showQr && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#00f2fe',
          light: '#0d1322'
        }
      }, (err) => {
        if (err) console.error('QR code error:', err);
      });
    }
  }, [showQr, shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleManualRevoke = async () => {
    if (!confirm('Are you sure you want to incinerate this secret immediately? Once burned, it can never be decrypted or viewed by anyone.')) {
      return;
    }
    setIsRevoking(true);
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
        onRevoke(id);
      } else {
        alert('Failed to revoke secret');
      }
    } catch (e) {
      console.error(e);
      alert('Error revoking secret');
    } finally {
      setIsRevoking(false);
    }
  };

  const formattedExpiry = new Date(expiresAt).toLocaleString();

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="glass-card-glow" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        {/* Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid var(--accent-emerald)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle size={36} color="var(--accent-emerald)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800 }}>
            Secret Encrypted & Vaulted!
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
            Share this unique link with your intended recipient.
          </p>
        </div>

        {/* Shareable Link Box */}
        <div style={{
          background: 'rgba(13, 19, 34, 0.9)',
          border: '1px solid var(--border-cyan)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '1.75rem'
        }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
            Shareable Encrypted Link (Contains Decryption Key)
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              readOnly
              className="input-field"
              value={shareUrl}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88rem',
                color: 'var(--accent-cyan)',
                flex: '1 1 300px'
              }}
            />
            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{ padding: '0.75rem 1.5rem', minWidth: '140px' }}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Secret Summary Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem'
        }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SECRET TITLE</span>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '0.2rem' }}>{title || 'Untitled Secret'}</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MAX VIEWS</span>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
              {maxViews} {maxViews === 1 ? 'View (Burn on Read)' : 'Views'}
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EXPIRES AT</span>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '0.2rem' }}>{formattedExpiry}</p>
          </div>
        </div>

        {/* Actions Row: QR Code & Immediate Revocation */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setShowQr(!showQr)}
              className="btn-secondary"
            >
              <QrCode size={18} color="var(--accent-cyan)" />
              <span>{showQr ? 'Hide QR Code' : 'Show Mobile QR'}</span>
            </button>

            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <ExternalLink size={18} />
              <span>Test Link</span>
            </a>
          </div>

          <button
            onClick={handleManualRevoke}
            className="btn-danger"
            disabled={isRevoking}
          >
            <Flame size={18} />
            <span>{isRevoking ? 'Incinerating...' : 'Incinerate Secret Now'}</span>
          </button>
        </div>

        {/* QR Code Canvas Modal Box */}
        {showQr && (
          <div style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            background: 'rgba(13, 19, 34, 0.95)',
            border: '1px solid var(--border-cyan)',
            borderRadius: '16px',
            padding: '1.5rem'
          }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Scan QR code with mobile camera to view secret
            </p>
            <canvas ref={qrCanvasRef} style={{ borderRadius: '8px', border: '2px solid var(--accent-cyan)' }} />
          </div>
        )}

        {/* Back Button */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <ArrowLeft size={16} />
            <span>Create another secret</span>
          </button>
        </div>
      </div>
    </div>
  );
}
