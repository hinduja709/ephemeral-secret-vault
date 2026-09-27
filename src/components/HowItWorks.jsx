import React from 'react';
import { ShieldCheck, Lock, Key, Flame, Cpu, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function HowItWorks() {
  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 0%, #00f2fe 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          Zero-Knowledge Security Architecture
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto' }}>
          How Ephemeral Secret Vault guarantees end-to-end privacy, zero server visibility, and cryptographic self-destruction.
        </p>
      </div>

      {/* Step Diagram Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Step 1 */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid var(--border-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Lock size={24} color="var(--accent-cyan)" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>STEP 01</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0.5rem' }}>
            In-Browser AES Encryption
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
            When you enter a secret, a random 256-bit AES-GCM key is generated using standard Web Crypto APIs (`window.crypto.subtle`). Encryption happens 100% in your local browser thread.
          </p>
        </div>

        {/* Step 2 */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Key size={24} color="var(--accent-purple)" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-purple)', textTransform: 'uppercase' }}>STEP 02</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0.5rem' }}>
            URL Hash Decryption Fragment
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
            The decryption key is appended ONLY to the URL fragment (`#key=...`). HTTP protocol specifies browsers <strong>never send URL hash fragments to web servers</strong>.
          </p>
        </div>

        {/* Step 3 */}
        <div className="glass-card" style={{ padding: '1.75rem', borderRadius: '20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255, 42, 95, 0.1)',
            border: '1px solid var(--accent-crimson)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Flame size={24} color="var(--accent-crimson)" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-crimson)', textTransform: 'uppercase' }}>STEP 03</span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, margin: '0.25rem 0 0.5rem' }}>
            Automated Incineration
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
            When the recipient decrypts the payload or when TTL time expires, the server permanently purges the ciphertext and emits a cryptographically verified Certificate of Destruction.
          </p>
        </div>
      </div>

      {/* Security Features Checklist */}
      <div className="glass-card-glow" style={{ padding: '2rem', borderRadius: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-bright)' }}>
          Core Cryptographic Guarantees
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Zero-Knowledge Storage</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>The server only holds encrypted ciphertext. Even in a breach, raw secrets cannot be decrypted without URL keys.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Memory & Disk Scrubbing</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Upon hit limit or expiration, secret payloads are unlinked and wiped instantly from system memory.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>PBKDF2 Password Key Derivation</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Optional passphrases use PBKDF2 with 10,000 rounds of SHA-256 for brute-force resistance.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CheckCircle2 size={20} color="var(--accent-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>AES-256-GCM Authenticated Encryption</h4>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>Guarantees confidentiality and integrity. Any tampering invalidates decryption automatically.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
