// AES encryption/decryption utilities using Web Crypto API

const ALGORITHM = 'AES-GCM';

async function getKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  const salt = enc.encode('cryptolock-salt-v1');
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(plaintext: string, password: string = 'cryptolock-default-key'): Promise<string> {
  const enc = new TextEncoder();
  const key = await getKey(password);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(plaintext)
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptMessage(ciphertext: string, password: string = 'cryptolock-default-key'): Promise<string> {
  const dec = new TextDecoder();
  const key = await getKey(password);
  const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encrypted
  );
  return dec.decode(decrypted);
}
