const encoder = new TextEncoder();

const toHex = (buffer) => [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

export function randomSalt(bytes = 16) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** PBKDF2-SHA256, 256 bits, hex encoded. The salt string is used as UTF-8 bytes (same as scripts/admin-hash.mjs). */
export async function hashPassword(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations },
    key,
    256,
  );
  return toHex(bits);
}

export function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
