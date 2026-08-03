const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function toBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function importEncryptionKey(base64) {
  const bytes = base64ToBytes(base64 || '');
  if (bytes.byteLength !== 32) throw new Error('TOKEN_ENCRYPTION_KEY_BASE64 must decode to exactly 32 bytes');
  return crypto.subtle.importKey('raw', bytes, {name: 'AES-GCM'}, false, ['encrypt', 'decrypt']);
}

export function createVault(base64Key) {
  let keyPromise;
  const key = () => keyPromise ||= importEncryptionKey(base64Key);

  async function seal(value, context) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      {name: 'AES-GCM', iv, additionalData: encoder.encode(context || '')},
      await key(),
      encoder.encode(String(value))
    );
    return `v1.${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`;
  }

  async function open(value, context) {
    const [version, ivEncoded, cipherEncoded] = String(value || '').split('.');
    if (version !== 'v1' || !ivEncoded || !cipherEncoded) throw new Error('Unsupported encrypted value');
    const decrypted = await crypto.subtle.decrypt(
      {name: 'AES-GCM', iv: base64ToBytes(ivEncoded), additionalData: encoder.encode(context || '')},
      await key(),
      base64ToBytes(cipherEncoded)
    );
    return decoder.decode(decrypted);
  }

  async function hash(value) {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
    return toBase64Url(new Uint8Array(digest));
  }

  return {seal, open, hash};
}

export async function hmac(value, secret) {
  if (!secret || secret.length < 32) throw new Error('OAUTH_STATE_HMAC_KEY must contain at least 32 characters');
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(String(value)));
  return toBase64Url(new Uint8Array(signature));
}
