import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Download, 
  Flame, 
  Clock, 
  AlertTriangle, 
  Key, 
  ShieldAlert, 
  FileCode,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { decryptText, decryptFile } from '../cryptoUtils';
import IncineratedView from './IncineratedView';
import confetti from 'canvas-confetti';

export default function ViewSecret({ secretId, decryptionKey, onReset }) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [passphrase, setPassphrase] = useState('');
  const [passphraseError, setPassphraseError] = useState('');

  const [revealed, setRevealed] = useState(false);
  const [plaintextSecret, setPlaintextSecret] = useState('');
  const [decryptedAttachment, setDecryptedAttachment] = useState(null);
  const [masked, setMasked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [isBurned, setIsBurned] = useState(false);
  const [burnInfo, setBurnInfo] = useState({ time: null, reason: null });

  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [confirmedWarning, setConfirmedWarning] = useState(false);

  // 1. Fetch Secret Metadata
  useEffect(() => {
    let timerId;
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`/api/secrets/${secretId}/meta`);
        const data = await res.json();

        if (!res.ok || data.isBurned) {
          setIsBurned(true);
          setBurnInfo({ time: data.burnedAt, reason: data.burnReason });
          setLoading(false);
          return;
        }

        setMeta(data);

        // Setup countdown timer
        const updateTimer = () => {
          const now = Date.now();
          const diff = data.expiresAt - now;
          if (diff <= 0) {
            setIsBurned(true);
            setBurnInfo({ time: now, reason: 'EXPIRED' });
            clearInterval(timerId);
          } else {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            if (hrs > 0) {
              setTimeLeftStr(`${hrs}h ${remMins}m ${secs}s`);
            } else {
              setTimeLeftStr(`${remMins}m ${secs}s`);
            }
          }
        };

        updateTimer();
        timerId = setInterval(updateTimer, 1000);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to connect to Vault server.');
        setLoading(false);
      }
    };

    fetchMetadata();
    return () => clearInterval(timerId);
  }, [secretId]);

  // Handle Reveal & Decrypt
  const handleReveal = async () => {
    if (meta?.isPasswordProtected && !passphrase.trim()) {
      setPassphraseError('Passphrase is required to unlock this secret.');
      return;
    }

    setPassphraseError('');
    setIsDecrypting(true);

    try {
      // Fetch encrypted ciphertext from backend reveal endpoint
      const res = await fetch(`/api/secrets/${secretId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: passphrase.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setPassphraseError(data.error || 'Incorrect passphrase');
          setIsDecrypting(false);
          return;
        }
        setIsBurned(true);
        setBurnInfo({ time: data.burnedAt || Date.now(), reason: data.burnReason || 'EXPIRED' });
        setIsDecrypting(false);
        return;
      }

      // Decrypt ciphertext client-side using Web Crypto API
      const decryptedText = await decryptText(data.ciphertext, data.salt, data.iv, decryptionKey);
      setPlaintextSecret(decryptedText);

      // Decrypt file attachment if present
      if (data.attachment) {
        const fileObj = await decryptFile(data.attachment, decryptionKey);
        setDecryptedAttachment(fileObj);
      }

      setRevealed(true);

      // Check if this view burned the secret
      if (data.isFinalView) {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#00f2fe', '#10b981', '#ff2a5f']
        });
      }
    } catch (err) {
      console.error(err);
      setError('Decryption failed. Invalid encryption key in URL.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleManualBurn = async () => {
    if (!confirm('Are you sure you want to incinerate this secret right now?')) return;
    try {
      await fetch(`/api/secrets/${secretId}/reveal`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      setIsBurned(true);
      setBurnInfo({ time: Date.now(), reason: 'MANUAL_REVOKE' });
    } catch (e) {
      setIsBurned(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(plaintextSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', borderRadius: '20px' }}>
          <Zap size={36} className="animate-spin" color="var(--accent-cyan)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)' }}>Decrypting Vault Handshake...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Fetching zero-knowledge metadata from secure vault node.
          </p>
        </div>
      </div>
    );
  }

  if (isBurned) {
    return (
      <IncineratedView
        secretId={secretId}
        title={meta?.title}
        burnedAt={burnInfo.time}
        burnReason={burnInfo.reason}
        onReset={onReset}
      />
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem', borderRadius: '20px', border: '1px solid var(--accent-crimson)' }}>
          <AlertTriangle size={36} color="var(--accent-crimson)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-crimson)' }}>Vault Handshake Error</h3>
          <p style={{ color: 'var(--text-secondary)', margin: '0.75rem 0 1.5rem' }}>{error}</p>
          <button onClick={onReset} className="btn-primary">Return to Main</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="glass-card-glow" style={{ padding: '2.5rem', borderRadius: '24px' }}>
        
        {/* Title Header */}
        <div style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '0.25rem' }}>
          🔒 END-TO-END ENCRYPTED SECRET
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>
          {meta.title || 'Encrypted Secret Payload'}
        </h2>

        {/* Badges & Telemetry Row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div className="badge badge-cyan" style={{ padding: '0.4rem 0.8rem' }}>
            <Clock size={14} />
            <span>EXPIRES IN: {timeLeftStr || 'Calculated...'}</span>
          </div>

          <div className="badge badge-amber" style={{ padding: '0.4rem 0.8rem' }}>
            <Eye size={14} />
            <span>VIEWS LEFT: {meta.viewsRemaining} of {meta.maxViews}</span>
          </div>

          {meta.isPasswordProtected && (
            <div className="badge badge-crimson" style={{ padding: '0.4rem 0.8rem' }}>
              <Key size={14} />
              <span>PASSPHRASE PROTECTED</span>
            </div>
          )}
        </div>

        {/* Unrevealed Warning & Reveal Trigger */}
        {!revealed ? (
          <div>
            {/* Confirmation Interstitial Notice */}
            {meta.requireWarning && !confirmedWarning ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid var(--accent-amber)',
                borderRadius: '16px',
                padding: '1.75rem',
                marginBottom: '1.75rem',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <ShieldAlert size={26} color="var(--accent-amber)" />
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                    Self-Destruct Expiration Warning
                  </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
                  This secret is configured to self-destruct once view counts are exhausted.
                  {meta.viewsRemaining === 1 ? (
                    <strong style={{ color: 'var(--accent-crimson)', display: 'block', marginTop: '0.5rem' }}>
                      ⚡ Warning: This is the FINAL view! Once revealed, this secret will be permanently destroyed.
                    </strong>
                  ) : (
                    <span> This secret has {meta.viewsRemaining} view(s) remaining.</span>
                  )}
                </p>
                <button
                  onClick={() => setConfirmedWarning(true)}
                  className="btn-primary"
                  style={{ marginTop: '1.25rem' }}
                >
                  <span>I Understand - Proceed to Unlock</span>
                </button>
              </div>
            ) : (
              <div>
                {/* Passphrase Input if Required */}
                {meta.isPasswordProtected && (
                  <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Enter Secret Unlock Passphrase:
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      placeholder="Passphrase..."
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                    />
                    {passphraseError && (
                      <p style={{ color: 'var(--accent-crimson)', fontSize: '0.82rem', marginTop: '0.4rem' }}>
                        {passphraseError}
                      </p>
                    )}
                  </div>
                )}

                {/* Big Reveal Button */}
                <button
                  onClick={handleReveal}
                  className="btn-primary pulse-glow"
                  disabled={isDecrypting}
                  style={{ width: '100%', padding: '1.2rem', fontSize: '1.15rem' }}
                >
                  {isDecrypting ? (
                    <>
                      <Zap className="animate-spin" size={22} />
                      <span>Decrypting Payload...</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={22} />
                      <span>Click to Reveal & Decrypt Secret</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Decrypted Secret Content View */
          <div>
            <div style={{
              background: 'rgba(13, 19, 34, 0.95)',
              border: '1px solid var(--border-cyan)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Decrypted Plaintext
                </span>
                <button
                  onClick={() => setMasked(!masked)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {masked ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{masked ? 'Show Text' : 'Mask Text'}</span>
                </button>
              </div>

              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '1.05rem',
                color: masked ? 'var(--text-muted)' : 'var(--text-bright)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                lineHeight: '1.6',
                minHeight: '80px',
                filter: masked ? 'blur(5px)' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {plaintextSecret}
              </pre>
            </div>

            {/* Encrypted Attachment Download */}
            {decryptedAttachment && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid var(--accent-emerald)',
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileCode size={24} color="var(--accent-emerald)" />
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>{decryptedAttachment.fileName}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(decryptedAttachment.fileSize / 1024).toFixed(1)} KB • Decrypted
                    </p>
                  </div>
                </div>

                <a
                  href={decryptedAttachment.blobUrl}
                  download={decryptedAttachment.fileName}
                  className="btn-primary"
                  style={{ background: 'var(--accent-emerald)', padding: '0.6rem 1.2rem', fontSize: '0.88rem' }}
                >
                  <Download size={16} />
                  <span>Download File</span>
                </a>
              </div>
            )}

            {/* Actions: Copy & Burn Now */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleCopy}
                className="btn-primary"
                style={{ flex: '1 1 200px', padding: '0.85rem' }}
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    <span>Copied Secret!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy Secret Text</span>
                  </>
                )}
              </button>

              <button
                onClick={handleManualBurn}
                className="btn-danger"
                style={{ flex: '1 1 200px', padding: '0.85rem' }}
              >
                <Flame size={18} />
                <span>Burn Secret Immediately</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
