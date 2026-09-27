import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Clock, 
  Eye, 
  FileText, 
  Upload, 
  X, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  FileCode,
  CheckCircle2,
  Trash2,
  Info
} from 'lucide-react';
import { generateRandomKey, encryptText, encryptFile } from '../cryptoUtils';

export default function CreateSecret({ onSecretCreated }) {
  const [secretText, setSecretText] = useState('');
  const [title, setTitle] = useState('');
  const [durationMs, setDurationMs] = useState(3600000); // 1 hour default
  const [maxViews, setMaxViews] = useState(1); // 1 view default (burn on read)
  const [passphrase, setPassphrase] = useState('');
  const [usePassphrase, setUsePassphrase] = useState(false);
  const [requireWarning, setRequireWarning] = useState(true);
  const [attachment, setAttachment] = useState(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  const durationOptions = [
    { label: '5 Minutes', value: 300000 },
    { label: '1 Hour', value: 3600000 },
    { label: '24 Hours', value: 86400000 },
    { label: '3 Days', value: 259200000 },
    { label: '7 Days', value: 604800000 },
  ];

  const viewOptions = [
    { label: '1 View (Burn on Read)', value: 1 },
    { label: '2 Views', value: 2 },
    { label: '5 Views', value: 5 },
    { label: '10 Views', value: 10 },
    { label: '50 Views', value: 50 },
  ];

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB for zero-knowledge browser encryption.');
      return;
    }

    setErrorMessage('');
    setAttachment(file);
  };

  const handleRemoveFile = () => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateSampleSecret = () => {
    const samples = [
      "API_KEY=sk_live_99a8b7c6d5e4f3a21098\nDB_PASS=V@ult_S3cr3t_2026!#\nAWS_SECRET=xYz1234567890abcdefGHIJKLMN",
      "Confidential Server Access:\nHost: 192.168.1.100\nUser: admin_vault\nPassword: 8x#kP9$2mL!vR5wQ\nSSH Key Fingerprint: SHA256:4a+98xZ/k10v",
      "One-time Recovery Tokens:\n1. 8834-1029-4491\n2. 9901-2248-7712\n3. 4120-9983-5561\n4. 6712-3341-0092"
    ];
    const chosen = samples[Math.floor(Math.random() * samples.length)];
    setSecretText(chosen);
    if (!title) setTitle('Encrypted Vault Payload');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!secretText.trim() && !attachment) {
      setErrorMessage('Please enter a secret message or attach a file.');
      return;
    }

    setErrorMessage('');
    setIsEncrypting(true);

    try {
      // 1. Generate client-side AES-256-GCM key
      const keyBase64 = await generateRandomKey();

      // 2. Encrypt secret text client-side
      const encryptedData = await encryptText(secretText || '(Attachment Only)', keyBase64);

      // 3. Encrypt file attachment if present
      let encryptedAttachment = null;
      if (attachment) {
        encryptedAttachment = await encryptFile(attachment, keyBase64);
      }

      // 4. Send encrypted payload to server
      const payload = {
        ciphertext: encryptedData.ciphertext,
        salt: encryptedData.salt,
        iv: encryptedData.iv,
        attachment: encryptedAttachment,
        title: title.trim() || 'Encrypted Secret',
        durationMs: Number(durationMs),
        maxViews: Number(maxViews),
        passphrase: usePassphrase ? passphrase.trim() : null,
        requireWarning
      };

      const res = await fetch('/api/secrets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server error creating secret');
      }

      // Construct shareable link with decryption key in URL hash
      const shareUrl = `${window.location.origin}/#id=${data.id}&key=${encodeURIComponent(keyBase64)}`;

      // Save to local history
      const historyItem = {
        id: data.id,
        title: title.trim() || 'Encrypted Secret',
        shareUrl,
        revokeKey: data.revokeKey,
        expiresAt: data.expiresAt,
        maxViews: data.maxViews,
        createdAt: data.createdAt,
        isBurned: false
      };

      const existingHistory = JSON.parse(localStorage.getItem('vault_history') || '[]');
      localStorage.setItem('vault_history', JSON.stringify([historyItem, ...existingHistory]));

      onSecretCreated(historyItem);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to encrypt and store secret.');
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Intro Banner */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem', borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{
            background: 'rgba(0, 242, 254, 0.1)',
            padding: '0.6rem',
            borderRadius: '12px',
            border: '1px solid rgba(0, 242, 254, 0.25)'
          }}>
            <ShieldCheck size={26} color="var(--accent-cyan)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700 }}>
              Store & Share Self-Destructing Secret
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Your message is encrypted directly in your browser using <strong>AES-256-GCM</strong>. The decryption key stays in the link fragment and is <strong>never sent to our server</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Secret Form */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', borderRadius: '20px' }}>
        {errorMessage && (
          <div style={{
            background: 'rgba(255, 42, 95, 0.1)',
            border: '1px solid var(--accent-crimson)',
            color: 'var(--text-primary)',
            padding: '0.9rem 1.2rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.9rem'
          }}>
            <AlertTriangle size={20} color="var(--accent-crimson)" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Secret Title */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem'
          }}>
            Secret Title / Description <span style={{ color: 'var(--text-muted)' }}>(Optional - visible before decryption)</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Production API Tokens, WiFi Password, Private Key"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
          />
        </div>

        {/* Secret Message Input Area */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Secret Content <span style={{ color: 'var(--accent-cyan)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={generateSampleSecret}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  textDecoration: 'underline'
                }}
              >
                <Sparkles size={13} />
                <span>Insert Sample</span>
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {secretText.length} chars
              </span>
            </div>
          </div>

          <textarea
            className="textarea-field"
            placeholder="Paste your sensitive passwords, tokens, credentials, or private notes here..."
            value={secretText}
            onChange={(e) => setSecretText(e.target.value)}
          />
        </div>

        {/* File Attachment Upload */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Encrypted File Attachment <span style={{ color: 'var(--text-muted)' }}>(Optional - max 5MB)</span>
          </label>

          {attachment ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.2rem',
              background: 'rgba(0, 242, 254, 0.06)',
              border: '1px solid var(--border-cyan)',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileCode size={22} color="var(--accent-cyan)" />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{attachment.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {(attachment.size / 1024).toFixed(1)} KB • Will be encrypted client-side
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-crimson)',
                  cursor: 'pointer',
                  padding: '0.4rem',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
                style={{ width: '100%', borderStyle: 'dashed', padding: '0.85rem' }}
              >
                <Upload size={18} color="var(--accent-cyan)" />
                <span>Attach Encrypted File (Image, PDF, Key, Doc)</span>
              </button>
            </div>
          )}
        </div>

        {/* Settings Grid: Expiration & View Limit */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.75rem'
        }}>
          {/* Expiration Time */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              <span>Vault Lifetime Expiration</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {durationOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationMs(opt.value)}
                  style={{
                    flex: '1 1 40%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: durationMs === opt.value ? 'rgba(0, 242, 254, 0.15)' : 'rgba(13, 19, 34, 0.6)',
                    border: durationMs === opt.value ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: durationMs === opt.value ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Views */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              <Eye size={16} color="var(--accent-cyan)" />
              <span>Max View Limit</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {viewOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMaxViews(opt.value)}
                  style={{
                    flex: '1 1 45%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: maxViews === opt.value ? 'rgba(0, 242, 254, 0.15)' : 'rgba(13, 19, 34, 0.6)',
                    border: maxViews === opt.value ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    color: maxViews === opt.value ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Options: Passphrase & Warning */}
        <div style={{
          background: 'rgba(13, 19, 34, 0.5)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Optional Passphrase Toggle */}
          <div style={{ marginBottom: usePassphrase ? '1rem' : 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={usePassphrase}
                onChange={(e) => setUsePassphrase(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={16} color="var(--accent-amber)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Enable Passphrase Protection
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Requires passphrase to unlock)</span>
              </div>
            </label>

            {usePassphrase && (
              <div style={{ marginTop: '0.75rem', paddingLeft: '2rem' }}>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Enter custom unlock passphrase..."
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '1rem 0' }} />

          {/* Warning Modal Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={requireWarning}
              onChange={(e) => setRequireWarning(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent-cyan)' }}
            />
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Require Recipient Confirmation Interstitial
              </span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Prevents accidental views by showing a "Click to Reveal" warning modal to the recipient.
              </p>
            </div>
          </label>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          className="btn-primary pulse-glow"
          disabled={isEncrypting}
          style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
        >
          {isEncrypting ? (
            <>
              <Zap className="animate-spin" size={20} />
              <span>Encrypting Secret (AES-256-GCM)...</span>
            </>
          ) : (
            <>
              <Lock size={20} />
              <span>Create Encrypted Vault Link</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
