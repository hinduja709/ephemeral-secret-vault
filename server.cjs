const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'vault_store.json');
const STATS_FILE = path.join(DATA_DIR, 'vault_stats.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global state
let vaultStore = {}; // id -> secret object
let globalStats = {
  totalCreated: 0,
  totalBurned: 0,
  totalViewsFulfilled: 0
};

// Load initial data
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    vaultStore = JSON.parse(raw);
  }
} catch (e) {
  console.error('Failed to load store, initializing empty:', e);
  vaultStore = {};
}

try {
  if (fs.existsSync(STATS_FILE)) {
    const raw = fs.readFileSync(STATS_FILE, 'utf-8');
    globalStats = JSON.parse(raw);
  }
} catch (e) {
  console.error('Failed to load stats, initializing default:', e);
}

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(vaultStore, null, 2));
  } catch (e) {
    console.error('Failed to save store:', e);
  }
}

function saveStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(globalStats, null, 2));
  } catch (e) {
    console.error('Failed to save stats:', e);
  }
}

// Background cleanup timer for expired secrets (every 3 seconds)
setInterval(() => {
  const now = Date.now();
  let updated = false;

  for (const id in vaultStore) {
    const item = vaultStore[id];
    if (!item.isBurned && now >= item.expiresAt) {
      // Burn secret due to expiration
      item.isBurned = true;
      item.burnedAt = now;
      item.burnReason = 'EXPIRED';
      delete item.ciphertext;
      delete item.salt;
      delete item.iv;
      delete item.attachment;
      globalStats.totalBurned++;
      updated = true;
    }
  }

  if (updated) {
    saveStore();
    saveStats();
  }
}, 3000);

// Helper hash for password protection
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
}

// API Routes

// 1. Create secret
app.post('/api/secrets', (req, res) => {
  try {
    const {
      ciphertext,
      salt,
      iv,
      title,
      durationMs,
      maxViews,
      passphrase,
      requireWarning,
      attachment // optional base64 or metadata
    } = req.body;

    if (!ciphertext || !salt || !iv) {
      return res.status(400).json({ error: 'Missing encrypted secret payload' });
    }

    const id = 'sec_' + crypto.randomBytes(12).toString('hex');
    const revokeKey = 'rev_' + crypto.randomBytes(16).toString('hex');
    const now = Date.now();
    const expiresAt = now + (Number(durationMs) || 3600000); // Default 1 hr
    const viewsAllowed = Math.max(1, Number(maxViews) || 1);

    let passwordSalt = null;
    let passwordHash = null;
    if (passphrase && passphrase.trim().length > 0) {
      passwordSalt = crypto.randomBytes(16).toString('hex');
      passwordHash = hashPassword(passphrase.trim(), passwordSalt);
    }

    const secretRecord = {
      id,
      title: title ? title.trim().slice(0, 100) : 'Encrypted Secret',
      ciphertext,
      salt,
      iv,
      attachment: attachment || null,
      maxViews: viewsAllowed,
      viewsRemaining: viewsAllowed,
      viewsCount: 0,
      expiresAt,
      createdAt: now,
      passwordSalt,
      passwordHash,
      requireWarning: Boolean(requireWarning),
      revokeKey,
      isBurned: false,
      burnedAt: null,
      burnReason: null
    };

    vaultStore[id] = secretRecord;
    globalStats.totalCreated++;

    saveStore();
    saveStats();

    res.status(201).json({
      success: true,
      id,
      revokeKey,
      expiresAt,
      maxViews: viewsAllowed,
      createdAt: now
    });
  } catch (err) {
    console.error('Error creating secret:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get Metadata (does NOT decrement views)
app.get('/api/secrets/:id/meta', (req, res) => {
  const { id } = req.params;
  const item = vaultStore[id];

  if (!item) {
    return res.status(404).json({ error: 'Secret not found or has been incinerated', isBurned: true });
  }

  const now = Date.now();
  if (!item.isBurned && now >= item.expiresAt) {
    item.isBurned = true;
    item.burnedAt = now;
    item.burnReason = 'EXPIRED';
    delete item.ciphertext;
    delete item.salt;
    delete item.iv;
    delete item.attachment;
    globalStats.totalBurned++;
    saveStore();
    saveStats();
  }

  if (item.isBurned) {
    return res.json({
      id: item.id,
      title: item.title,
      isBurned: true,
      burnedAt: item.burnedAt,
      burnReason: item.burnReason || 'VIEW_LIMIT'
    });
  }

  res.json({
    id: item.id,
    title: item.title,
    expiresAt: item.expiresAt,
    maxViews: item.maxViews,
    viewsRemaining: item.viewsRemaining,
    isPasswordProtected: Boolean(item.passwordHash),
    requireWarning: item.requireWarning,
    createdAt: item.createdAt,
    hasAttachment: Boolean(item.attachment),
    isBurned: false
  });
});

// 3. Reveal Secret (Increments views count & incinerates if limit hit)
app.post('/api/secrets/:id/reveal', (req, res) => {
  const { id } = req.params;
  const { passphrase } = req.body;
  const item = vaultStore[id];

  if (!item) {
    return res.status(404).json({ error: 'Secret not found or already incinerated', isBurned: true });
  }

  const now = Date.now();
  if (item.isBurned || now >= item.expiresAt) {
    if (!item.isBurned) {
      item.isBurned = true;
      item.burnedAt = now;
      item.burnReason = 'EXPIRED';
      delete item.ciphertext;
      delete item.salt;
      delete item.iv;
      delete item.attachment;
      globalStats.totalBurned++;
      saveStore();
      saveStats();
    }
    return res.status(410).json({ error: 'Secret has expired and was incinerated', isBurned: true, burnReason: item.burnReason });
  }

  // Check password if set
  if (item.passwordHash) {
    if (!passphrase) {
      return res.status(401).json({ error: 'Passphrase required to decrypt this secret' });
    }
    const computedHash = hashPassword(passphrase, item.passwordSalt);
    if (computedHash !== item.passwordHash) {
      return res.status(401).json({ error: 'Incorrect passphrase' });
    }
  }

  // Decrement views
  item.viewsCount += 1;
  item.viewsRemaining -= 1;
  globalStats.totalViewsFulfilled += 1;

  const ciphertext = item.ciphertext;
  const salt = item.salt;
  const iv = item.iv;
  const attachment = item.attachment;
  const viewsLeft = item.viewsRemaining;
  let isFinalView = false;

  if (item.viewsRemaining <= 0) {
    item.isBurned = true;
    item.burnedAt = now;
    item.burnReason = 'VIEW_LIMIT';
    isFinalView = true;

    // Destroy payload immediately from memory
    delete item.ciphertext;
    delete item.salt;
    delete item.iv;
    delete item.attachment;

    globalStats.totalBurned++;
  }

  saveStore();
  saveStats();

  res.json({
    success: true,
    ciphertext,
    salt,
    iv,
    attachment,
    isFinalView,
    viewsRemaining: Math.max(0, viewsLeft),
    burnedAt: item.burnedAt
  });
});

// 4. Revoke / Manually Destroy Secret
app.delete('/api/secrets/:id', (req, res) => {
  const { id } = req.params;
  const revokeKey = req.headers['x-revoke-key'] || req.body.revokeKey;
  const item = vaultStore[id];

  if (!item) {
    return res.status(404).json({ error: 'Secret not found' });
  }

  if (item.revokeKey !== revokeKey) {
    return res.status(403).json({ error: 'Invalid revoke key authorization' });
  }

  if (!item.isBurned) {
    item.isBurned = true;
    item.burnedAt = Date.now();
    item.burnReason = 'MANUAL_REVOKE';
    delete item.ciphertext;
    delete item.salt;
    delete item.iv;
    delete item.attachment;
    globalStats.totalBurned++;
    saveStore();
    saveStats();
  }

  res.json({
    success: true,
    message: 'Secret incinerated immediately',
    burnedAt: item.burnedAt
  });
});

// 5. Global Stats
app.get('/api/stats', (req, res) => {
  const activeCount = Object.values(vaultStore).filter(s => !s.isBurned && Date.now() < s.expiresAt).length;
  res.json({
    totalCreated: globalStats.totalCreated,
    totalBurned: globalStats.totalBurned,
    totalViewsFulfilled: globalStats.totalViewsFulfilled,
    activeSecrets: activeCount
  });
});

// Serve Vite static assets if in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Vault API Server running on port ${PORT}`);
});
