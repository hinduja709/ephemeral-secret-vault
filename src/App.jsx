import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CreateSecret from './components/CreateSecret';
import SecretCreatedModal from './components/SecretCreatedModal';
import ViewSecret from './components/ViewSecret';
import SecretHistory from './components/SecretHistory';
import HowItWorks from './components/HowItWorks';
import StatsModal from './components/StatsModal';
import { Lock, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [createdSecretData, setCreatedSecretData] = useState(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // Parse URL Hash Fragment for recipient view: #id=sec_xxx&key=yyy
  const [urlSecret, setUrlSecret] = useState({ id: null, key: null });

  const parseHash = () => {
    const hash = window.location.hash.substring(1); // remove '#'
    if (hash) {
      const params = new URLSearchParams(hash);
      const id = params.get('id');
      const key = params.get('key');
      if (id && key) {
        setUrlSecret({ id, key: decodeURIComponent(key) });
        return;
      }
    }
    setUrlSecret({ id: null, key: null });
  };

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleResetToMain = () => {
    window.location.hash = '';
    setUrlSecret({ id: null, key: null });
    setCreatedSecretData(null);
    setActiveTab('create');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (urlSecret.id) window.location.hash = '';
          setActiveTab(tab);
          setCreatedSecretData(null);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
      />

      {/* Main Content Body */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {/* Case 1: Recipient viewing secret via link fragment */}
        {urlSecret.id && urlSecret.key ? (
          <ViewSecret
            secretId={urlSecret.id}
            decryptionKey={urlSecret.key}
            onReset={handleResetToMain}
          />
        ) : createdSecretData ? (
          /* Case 2: Just created secret modal view */
          <SecretCreatedModal
            secretData={createdSecretData}
            onClose={() => setCreatedSecretData(null)}
            onRevoke={(burnedId) => {
              setCreatedSecretData(null);
              setActiveTab('history');
            }}
          />
        ) : (
          /* Case 3: Standard Tabs */
          <>
            {activeTab === 'create' && (
              <CreateSecret
                onSecretCreated={(data) => setCreatedSecretData(data)}
              />
            )}

            {activeTab === 'history' && (
              <SecretHistory
                onSelectSecret={(data) => setCreatedSecretData(data)}
              />
            )}

            {activeTab === 'how-it-works' && <HowItWorks />}
          </>
        )}
      </main>

      {/* Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        background: 'rgba(7, 10, 17, 0.95)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="var(--accent-cyan)" />
            <span>Ephemeral Secret Vault • Client-Side End-to-End Encryption</span>
          </div>
          <div>
            <span>Powered by Web Crypto API (AES-256-GCM)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
