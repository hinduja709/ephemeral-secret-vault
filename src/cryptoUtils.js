/**
 * Ephemeral Secret Vault - Web Crypto API Utilities
 * End-to-End Zero-Knowledge Encryption using AES-256-GCM
 */

// Helper to convert Uint8Array / ArrayBuffer to Base64 string
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 string to Uint8Array
export function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Generate a random 256-bit (32 byte) key for AES-GCM
export async function generateRandomKey() {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
  
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Import key from Base64 string
async function importKey(keyBase64) {
  const rawKey = base64ToBuffer(keyBase64);
  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt string or text payload using AES-256-GCM
 * Returns { ciphertext, salt, iv } as Base64 strings
 */
export async function encryptText(plaintext, keyBase64) {
  const key = await importKey(keyBase64);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // 128-bit Salt
  
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt ciphertext using keyBase64 and ivBase64
 * Returns decrypted UTF-8 string
 */
export async function decryptText(ciphertextBase64, saltBase64, ivBase64, keyBase64) {
  try {
    const key = await importKey(keyBase64);
    const ciphertext = base64ToBuffer(ciphertextBase64);
    const iv = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Decryption failed. Invalid decryption key or corrupted secret.');
  }
}

/**
 * Encrypt a File object
 */
export async function encryptFile(file, keyBase64) {
  const arrayBuffer = await file.arrayBuffer();
  const key = await importKey(keyBase64);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  return {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    encryptedData: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv)
  };
}

/**
 * Decrypt a File payload
 */
export async function decryptFile(attachmentPayload, keyBase64) {
  const key = await importKey(keyBase64);
  const iv = base64ToBuffer(attachmentPayload.iv);
  const encryptedBuffer = base64ToBuffer(attachmentPayload.encryptedData);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedBuffer
  );

  const blob = new Blob([decryptedBuffer], { type: attachmentPayload.fileType || 'application/octet-stream' });
  return {
    blobUrl: URL.createObjectURL(blob),
    fileName: attachmentPayload.fileName,
    fileType: attachmentPayload.fileType,
    fileSize: attachmentPayload.fileSize
  };
}

/**
 * SHA-256 fingerprint for destruction audit certificates
 */
export async function computeHash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
